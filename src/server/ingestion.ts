import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import {
  getDb,
  saveDb,
  normalizeCanonicalUrl,
  computeContentHash,
  StoredSource,
  StoredArticle,
  FetchLogEntry,
  getRelevanceConfig,
} from './db.ts';
import { classifyThemes, ThemeId } from '../themes.ts';
import { evaluate, llmGate, SourceChannel, RawItem, AuditRow } from '../relevance.ts';
import { extractPublishedDate } from '../freshness.ts';

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (Compatible; AwashIntelligence/1.0)',
    Accept: 'application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
  },
});

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AwashBankModernizationMonitor/1.0';

interface RawFeedItem {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
}

// Common RSS paths to probe
const RSS_PATHS = [
  '',
  '/feed',
  '/feed/',
  '/rss',
  '/rss.xml',
  '/feed.xml',
  '/news/feed',
  '/news/rss',
  '/index.xml',
  '/atom.xml',
];

// Verify link via HEAD or lightweight GET request
export async function verifyLink(url: string, expectedTitle: string): Promise<{ ok: boolean; status: number; pageTitle?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Try HEAD first
    let res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    }).catch(() => null);

    // If HEAD not allowed or failed, fallback to GET with byte limit
    if (!res || !res.ok) {
      res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT, Range: 'bytes=0-8192' },
        signal: controller.signal,
        redirect: 'follow',
      }).catch(() => null);
    }

    clearTimeout(timeout);
    if (!res || !res.ok) {
      return { ok: false, status: res ? res.status : 0 };
    }

    let pageTitle = '';
    try {
      const html = await res.text();
      const $ = cheerio.load(html);
      pageTitle = $('title').text().trim();
    } catch {}

    // Check similarity: at least a couple of significant words overlap
    const expectedWords = expectedTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const titleLower = pageTitle.toLowerCase();
    const matchesTitle =
      !pageTitle ||
      expectedWords.length === 0 ||
      expectedWords.filter((w) => titleLower.includes(w)).length >= Math.min(2, expectedWords.length);

    return {
      ok: res.status >= 200 && res.status < 400 && matchesTitle,
      status: res.status,
      pageTitle,
    };
  } catch {
    return { ok: false, status: 0 };
  }
}

// Scrape HTML articles from homepage/news page when RSS isn't directly available
async function scrapeHtmlArticles(source: StoredSource): Promise<RawFeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(source.url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);
    const items: RawFeedItem[] = [];

    // Find article elements, news items, or blog posts
    $('article, .news-item, .post, .entry, .article, .news-card, h2 a, h3 a').each((_, el) => {
      if (items.length >= 10) return;

      let link = '';
      let title = '';
      let snippet = '';

      if ($(el).is('a')) {
        link = $(el).attr('href') || '';
        title = $(el).text().trim();
      } else {
        const linkEl = $(el).find('a').first();
        link = linkEl.attr('href') || '';
        const titleEl = $(el).find('h1, h2, h3, h4, .title').first();
        title = titleEl.text().trim() || linkEl.text().trim();
        snippet = $(el).find('p, .summary, .excerpt, .desc').first().text().trim();
      }

      if (!link || !title || title.length < 15) return;

      // Resolve relative URL
      try {
        link = new URL(link, source.url).toString();
      } catch {
        return;
      }

      // Check if URL looks like an article rather than a navigation link
      if (
        link === source.url ||
        link === `${source.url}/` ||
        link.includes('/tag/') ||
        link.includes('/category/') ||
        link.includes('/author/') ||
        link.includes('#')
      ) {
        return;
      }

      // Extract published date using freshness parser or fallback
      const extractedDate = extractPublishedDate(html, link, snippet || title);
      const pubDateIso = extractedDate ? extractedDate.toISOString() : new Date().toISOString();

      items.push({
        title,
        link,
        pubDate: pubDateIso,
        contentSnippet: snippet || title,
        content: snippet || title,
      });
    });

    return items;
  } catch {
    return [];
  }
}

// Probe for RSS feed
async function fetchRssFeed(source: StoredSource): Promise<RawFeedItem[] | null> {
  const candidates: string[] = [];
  if (source.feed_url) {
    candidates.push(source.feed_url);
  }

  // Derive candidate endpoints
  const cleanUrl = source.url.replace(/\/$/, '');
  for (const path of RSS_PATHS) {
    const candidate = `${cleanUrl}${path}`;
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }

  for (const candidate of candidates) {
    try {
      const feed = await rssParser.parseURL(candidate);
      if (feed && feed.items && feed.items.length > 0) {
        // Save discovered working feed_url
        if (source.feed_url !== candidate) {
          source.feed_url = candidate;
        }
        return feed.items.map((item) => ({
          title: item.title?.trim() || '',
          link: item.link?.trim() || '',
          pubDate: item.pubDate || (item as any).isoDate || new Date().toISOString(),
          contentSnippet: item.contentSnippet || item.summary || '',
          content: (item as any)['content:encoded'] || item.content || item.contentSnippet || '',
        }));
      }
    } catch {
      // try next path
    }
  }

  return null;
}

export async function ingestSource(sourceId: string): Promise<{
  status: 'success' | 'failed' | 'empty';
  found: number;
  newCount: number;
  error?: string;
}> {
  const db = getDb();
  const source = db.sources[sourceId];
  if (!source || !source.active) {
    return { status: 'empty', found: 0, newCount: 0 };
  }

  const now = new Date().toISOString();
  let rawItems: RawFeedItem[] | null = null;
  let fetchError: string | undefined = undefined;

  // 1. Try RSS / Atom
  try {
    rawItems = await fetchRssFeed(source);
  } catch (err: any) {
    fetchError = err.message;
  }

  // 2. If no RSS, try HTML scrape
  if (!rawItems || rawItems.length === 0) {
    try {
      rawItems = await scrapeHtmlArticles(source);
    } catch (err: any) {
      fetchError = err.message;
    }
  }

  if (!rawItems || rawItems.length === 0) {
    const logEntry: FetchLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      source_id: source.id,
      source_name: source.name,
      run_at: now,
      status: fetchError ? 'failed' : 'empty',
      items_found: 0,
      items_new: 0,
      error: fetchError || 'No feed items discovered at endpoints',
    };
    db.fetch_log.unshift(logEntry);
    source.last_fetched = now;
    source.last_status = fetchError ? 'error' : 'ok';
    source.last_error = fetchError;
    saveDb();
    return { status: fetchError ? 'failed' : 'empty', found: 0, newCount: 0, error: fetchError };
  }

  let newItemsCount = 0;
  const config = getRelevanceConfig();

  // Deduplicate and process items
  for (const item of rawItems) {
    // Non-negotiable rule 2: Every displayed item must have a stored original_url that was actually fetched
    // and a publish date. If it has no URL or no publish date, reject it.
    if (!item.link || !item.title || !item.pubDate) {
      continue;
    }

    const canonicalUrl = normalizeCanonicalUrl(item.link);
    const rawContent = (item.content || item.contentSnippet || item.title).trim();
    const contentHash = computeContentHash(rawContent);

    // Check if canonicalUrl or contentHash already exists in DB
    const existingArticle = Object.values(db.articles).find(
      (a) => a.canonical_url === canonicalUrl || a.content_hash === contentHash
    );

    if (existingArticle) {
      // Syndicated duplicate: A story syndicated on multiple sources appears once, with all sources listed
      const alreadyListed = existingArticle.syndicated_sources.some(
        (s) => s.source_id === source.id || s.original_url === item.link
      );
      if (!alreadyListed && existingArticle.source_id !== source.id) {
        existingArticle.syndicated_sources.push({
          source_id: source.id,
          source_name: source.name,
          original_url: item.link,
          fetched_at: now,
        });
      }
      continue;
    }

    // Rate cap for P3_GSIB: Cap 3 items per bank per day; keep only items matching theme filter
    if (source.group === 'P3_GSIB') {
      const todayStr = now.split('T')[0];
      const todayBankItems = Object.values(db.articles).filter(
        (a) => a.source_id === source.id && a.fetched_at.startsWith(todayStr)
      );
      if (todayBankItems.length >= 3) {
        continue;
      }
    }

    // Combined text for theme & entity matching
    const lowerCombined = `${item.title} ${rawContent}`.toLowerCase();

    // Alert Queue check (P1 only): NBE directives, ECMA notices and Awash/CBE/Dashen/Abyssinia announcements
    const isNbeAlert =
      source.name.includes('National Bank of Ethiopia') ||
      source.name.includes('ECMA') ||
      lowerCombined.includes('nbe directive') ||
      lowerCombined.includes('circular') ||
      lowerCombined.includes('ecma notice') ||
      ((source.group === 'P1_ETHIOPIAN_BANKS' || source.group === 'OWN_BRAND') &&
        (source.name.includes('Awash') ||
          source.name.includes('Commercial Bank of Ethiopia') ||
          source.name.includes('Dashen') ||
          source.name.includes('Abyssinia')));

    // Paywall Handling: American Banker, The Banker, Central Banking, Forbes -> store snippet only
    const isPaywalled = source.is_paywalled || false;
    const storedText = isPaywalled ? (item.contentSnippet || item.title).slice(0, 400) : rawContent.slice(0, 10000);

    // Language check: "dont update anything other than english and amharic and afan oromo"
    let detectedLang: 'en' | 'am' | 'om' | 'other' = 'en';
    if (/[\u1200-\u137F]/.test(rawContent) || /[\u1200-\u137F]/.test(item.title)) {
      detectedLang = 'am';
    } else if (/[\u4e00-\u9fff\u0400-\u04ff\u0600-\u06ff\u3040-\u30ff]/.test(rawContent) || /[\u4e00-\u9fff\u0400-\u04ff\u0600-\u06ff\u3040-\u30ff]/.test(item.title)) {
      detectedLang = 'other';
    } else {
      const lower = `${item.title} ${rawContent}`.toLowerCase();
      const oromoTokens = ['baankii', 'hojii', 'oromiyaa', 'finfinnee', 'kaffaltii', 'dhaabbata', 'mootummaa', 'biyyooleessaa', 'gabaa', 'waliigaltee', 'ammayyeessaa', 'obbo'];
      if (oromoTokens.some((t) => lower.includes(t))) {
        detectedLang = 'om';
      }
    }

    // Strictly skip non-supported languages per user instruction
    if (detectedLang === 'other') {
      continue;
    }

    // Map source to SourceChannel for relevance evaluation
    const sourceChannel: SourceChannel = {
      id: source.id,
      name: source.name,
      url: source.url,
      group: source.group,
      geography: (source.group.includes('ETHIOPIA') || source.group === 'OWN_BRAND' || source.group.includes('REGULATOR')) ? 'Ethiopia' : source.group.includes('AFRICA') ? 'Africa' : source.group.includes('GSIB') ? 'Global' : 'Cross-border',
      tier: (source.reliability_tier as 1 | 2 | 3) || (source.priority === 'P1' ? 1 : source.priority === 'P2' ? 2 : 3),
      enabled: source.active,
    };

    const rawItem: RawItem = {
      sourceId: source.id,
      url: item.link,
      title: item.title,
      text: rawContent,
      publishedAt: item.pubDate,
    };

    // Run relevance pipeline: domain check -> path rules -> hard blocks -> rate tables -> weighted scoring
    const verdict = evaluate(rawItem, sourceChannel);
    let keep = verdict.keep;
    let stage = verdict.stage;
    const reasons = [...verdict.reasons];

    // Borderline items undergo Gemini gate screening if key is present
    if (!keep && verdict.borderline && process.env.GEMINI_API_KEY) {
      try {
        const g = await llmGate(rawItem, process.env.GEMINI_API_KEY);
        keep = g.relevant;
        stage = 'llm-gate';
        reasons.push(`llm: ${g.reason}`);
      } catch (err: any) {
        reasons.push(`llm-error: ${err.message}`);
      }
    }

    // Audit trail logging
    if (!db.relevance_audit) db.relevance_audit = [];
    const auditRow: AuditRow = {
      url: item.link,
      title: item.title,
      sourceId: source.id,
      decision: keep ? 'kept' : 'dropped',
      stage,
      score: verdict.score,
      reasons,
    };
    db.relevance_audit.unshift(auditRow);
    if (db.relevance_audit.length > 500) {
      db.relevance_audit = db.relevance_audit.slice(0, 500);
    }

    if (!keep) {
      continue; // drop non-relevant article
    }

    // Determine previous categorization: Geography
    let geography: 'Global' | 'Africa' | 'Ethiopia' | 'Cross-border' = 'Global';
    if (
      source.group.includes('ETHIOPIA') ||
      source.group === 'OWN_BRAND' ||
      lowerCombined.includes('ethiopia') ||
      lowerCombined.includes('addis') ||
      lowerCombined.includes('nbe') ||
      lowerCombined.includes('cbe') ||
      lowerCombined.includes('awash') ||
      lowerCombined.includes('birr') ||
      lowerCombined.includes('ethswitch') ||
      lowerCombined.includes('dashen') ||
      lowerCombined.includes('wegagen')
    ) {
      geography = 'Ethiopia';
    } else if (
      lowerCombined.includes('papss') ||
      lowerCombined.includes('cross-border') ||
      lowerCombined.includes('remittance') ||
      lowerCombined.includes('diaspora') ||
      lowerCombined.includes('swift')
    ) {
      geography = 'Cross-border';
    } else if (
      source.group.includes('AFRICA') ||
      lowerCombined.includes('africa') ||
      lowerCombined.includes('kenya') ||
      lowerCombined.includes('nigeria') ||
      lowerCombined.includes('south africa') ||
      lowerCombined.includes('egypt') ||
      lowerCombined.includes('ghana')
    ) {
      geography = 'Africa';
    }

    // Determine previous categorization: Category
    let category: StoredArticle['category'] = 'Transformation Initiative / Strategy Announcement';
    if (
      lowerCombined.includes('launch') ||
      lowerCombined.includes('rollout') ||
      lowerCombined.includes('unveil') ||
      lowerCombined.includes('release') ||
      lowerCombined.includes('introduce')
    ) {
      category = 'Product/Service Launch';
    } else if (
      lowerCombined.includes('partner') ||
      lowerCombined.includes('alliance') ||
      lowerCombined.includes('teams up') ||
      lowerCombined.includes('collaborat') ||
      lowerCombined.includes('joint')
    ) {
      category = 'Partnership';
    } else if (
      lowerCombined.includes('acqui') ||
      lowerCombined.includes('vendor deal') ||
      lowerCombined.includes('procure') ||
      lowerCombined.includes('selected temenos') ||
      lowerCombined.includes('selected finastra') ||
      lowerCombined.includes('selected mambu')
    ) {
      category = 'Technology Acquisition / Platform Deal';
    } else if (
      lowerCombined.includes('automat') ||
      lowerCombined.includes('process') ||
      lowerCombined.includes('straight-through') ||
      lowerCombined.includes('ekyc') ||
      lowerCombined.includes('fayda') ||
      lowerCombined.includes('workflow') ||
      lowerCombined.includes('api gateway')
    ) {
      category = 'Business Process Modernization / Automation';
    } else if (
      lowerCombined.includes('series') ||
      lowerCombined.includes('raised') ||
      lowerCombined.includes('funding') ||
      lowerCombined.includes('valuation') ||
      lowerCombined.includes('capital')
    ) {
      category = 'Funding / Valuation Signal';
    }

    // Determine previous categorization: Impact
    let impact: StoredArticle['impact'] = 'Medium';
    if (
      isNbeAlert ||
      source.priority === 'P1' ||
      source.category === 'Regulator' ||
      lowerCombined.includes('systemic') ||
      lowerCombined.includes('central bank') ||
      lowerCombined.includes('afreximbank') ||
      lowerCombined.includes('standard bank') ||
      lowerCombined.includes('jpmorgan')
    ) {
      impact = 'High (large bank or systemic)';
    } else if (lowerCombined.includes('pilot') || lowerCombined.includes('early stage') || lowerCombined.includes('explores')) {
      impact = 'Watchlist';
    }

    // Determine previous categorization: Reliability
    let reliability: StoredArticle['reliability'] = 'Tier-2 (reputable media)';
    if (
      source.priority === 'P1' ||
      source.priority === 'OWN_BRAND' ||
      source.category === 'Regulator' ||
      source.category === 'Bank' ||
      source.category === 'Market Infra'
    ) {
      reliability = 'Tier-1 (press release / official)';
    }

    const defaultTakeaway = `Key ${category.toLowerCase()} signal affecting ${geography} banking infrastructure, regulatory compliance, and transaction settlement velocity.`;
    const matchedThemes = classifyThemes(lowerCombined, geography, 3);

    const articleId = `art-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newArticle: StoredArticle = {
      id: articleId,
      source_id: source.id,
      source_name: source.name,
      source_group: source.group,
      original_url: item.link,
      canonical_url: canonicalUrl,
      title_original: item.title,
      published_at: new Date(item.pubDate).toISOString(),
      fetched_at: now,
      raw_text: storedText,
      content_hash: contentHash,
      tags: matchedThemes.length > 0 ? matchedThemes : ['core_composable'],
      relevance_score: Math.min(10, Math.max(1, Math.round(verdict.score))),
      relevance_reason: reasons.slice(0, 3).join('; '),
      verification_status: 'unverified', // will be verified via link check
      status: 'new',
      syndicated_sources: [],
      is_paywalled: isPaywalled,
      is_nbe_alert: isNbeAlert,
      geography,
      category,
      impact,
      reliability,
      language: detectedLang,
      takeaway: defaultTakeaway,
    };

    db.articles[articleId] = newArticle;
    newItemsCount++;
  }

  // Update source statistics
  source.items_count = (source.items_count || 0) + newItemsCount;
  source.last_fetched = now;
  source.last_status = 'ok';
  source.last_error = undefined;

  const logEntry: FetchLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    source_id: source.id,
    source_name: source.name,
    run_at: now,
    status: 'success',
    items_found: rawItems.length,
    items_new: newItemsCount,
  };
  db.fetch_log.unshift(logEntry);
  if (db.fetch_log.length > 500) {
    db.fetch_log = db.fetch_log.slice(0, 500);
  }

  saveDb();
  return { status: 'success', found: rawItems.length, newCount: newItemsCount };
}

// Ingest batch of sources
export async function runIngestionBatch(
  groupFilter?: string,
  skipSourceIds?: string[]
): Promise<{
  sourcesPolled: number;
  newArticles: number;
  errors: number;
}> {
  const db = getDb();
  const sources = Object.values(db.sources).filter((s) => {
    if (!s.active) return false;
    if (skipSourceIds && skipSourceIds.includes(s.id)) return false;
    if (groupFilter && s.group !== groupFilter && groupFilter !== 'ALL') return false;
    return true;
  });

  let totalNew = 0;
  let totalErrors = 0;
  let polled = 0;

  for (const src of sources) {
    try {
      const res = await ingestSource(src.id);
      polled++;
      totalNew += res.newCount;
      if (res.status === 'failed') totalErrors++;
    } catch {
      totalErrors++;
    }
  }

  db.status.last_sync_time = new Date().toISOString();
  db.status.last_sync_status = totalErrors === 0 ? 'success' : totalErrors < polled ? 'partial' : 'failed';
  db.status.last_sync_error = totalErrors > 0 ? `${totalErrors} sources encountered errors during polling.` : null;
  saveDb();

  return { sourcesPolled: polled, newArticles: totalNew, errors: totalErrors };
}
