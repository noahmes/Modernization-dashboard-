import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { SEED_SOURCES_RAW, PAYWALLED_DOMAINS, ISLAMIC_BANKS, SeedSource } from './sourcesSeed.ts';
import { DEFAULT_RELEVANCE_CONFIG, RelevanceRuleConfig } from './relevanceConfig.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'intelligence_db.json');
const CONFIG_FILE = path.join(DATA_DIR, 'relevance_config.json');

export interface StoredSource {
  id: string;
  name: string;
  url: string;
  feed_url: string;
  type: 'rss' | 'html' | 'sitemap';
  category: 'Media' | 'Bank' | 'Regulator' | 'Market Infra';
  language: string;
  reliability_tier: 1 | 2 | 3;
  fetch_interval: number; // minutes
  css_selectors: string;
  active: boolean;
  last_fetched?: string;
  last_status: 'ok' | 'error' | 'pending' | 'dormant' | 'blocked';
  last_error?: string;
  group: SeedSource['group'];
  priority: 'P1' | 'P2' | 'P3' | 'OWN_BRAND';
  is_islamic?: boolean;
  is_paywalled?: boolean;
  items_count: number;
}

export interface StoredArticle {
  id: string;
  source_id: string;
  source_name: string;
  source_group: string;
  original_url: string;
  canonical_url: string;
  title_original: string;
  published_at: string; // ISO date
  fetched_at: string;
  raw_text: string;
  content_hash: string;
  summary_ai?: string;
  tags: string[];
  relevance_score: number;
  relevance_reason?: string;
  awash_implication?: string;
  verification_status: 'verified' | 'unverified';
  link_checked_at?: string;
  status: 'new' | 'reviewed' | 'starred' | 'archived';
  syndicated_sources: Array<{
    source_id: string;
    source_name: string;
    original_url: string;
    fetched_at: string;
  }>;
  is_paywalled: boolean;
  is_nbe_alert: boolean;
  geography: 'Global' | 'Africa' | 'Ethiopia' | 'Cross-border';
  category:
    | 'Product/Service Launch'
    | 'Partnership'
    | 'Technology Acquisition / Platform Deal'
    | 'Business Process Modernization / Automation'
    | 'Transformation Initiative / Strategy Announcement'
    | 'Funding / Valuation Signal';
  impact: 'High (large bank or systemic)' | 'Medium' | 'Watchlist';
  reliability: 'Tier-1 (press release / official)' | 'Tier-2 (reputable media)' | 'Social / Unverified';
  language: 'en' | 'am' | 'om';
  takeaway?: string;
  entities?: {
    bankOrFintech?: string;
    partnerOrVendor?: string;
    regulatorOrPlatform?: string;
  };
}

export interface FetchLogEntry {
  id: string;
  source_id: string;
  source_name: string;
  run_at: string;
  status: 'success' | 'failed' | 'empty';
  items_found: number;
  items_new: number;
  error?: string;
}

import { AuditRow } from '../relevance.ts';

export interface SystemStatus {
  last_sync_time: string | null;
  last_sync_status: 'success' | 'partial' | 'failed' | 'idle';
  last_sync_error: string | null;
  total_items_today: number;
  llm_calls_today: number;
  llm_date: string;
}

export interface DatabaseState {
  sources: Record<string, StoredSource>;
  articles: Record<string, StoredArticle>;
  fetch_log: FetchLogEntry[];
  relevance_audit?: AuditRow[];
  status: SystemStatus;
}

// In-memory active cache
let memoryDb: DatabaseState | null = null;
let memoryConfig: RelevanceRuleConfig | null = null;

export function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function normalizeCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // remove utm params, hashes, and trailing slash
    const searchParams = new URLSearchParams(parsed.search);
    const keysToRemove: string[] = [];
    searchParams.forEach((_, key) => {
      if (key.startsWith('utm_') || key === 'ref' || key === 'fbclid') {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach((k) => searchParams.delete(k));
    parsed.search = searchParams.toString() ? `?${searchParams.toString()}` : '';
    parsed.hash = '';
    let clean = parsed.toString();
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    return url.trim().replace(/\/$/, '');
  }
}

export function computeContentHash(text: string): string {
  // normalize whitespace, lowercase
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function getDb(): DatabaseState {
  if (memoryDb) return memoryDb;
  ensureDataDirectory();

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(data);
      if (memoryDb) return memoryDb;
    } catch (e) {
      console.error('Failed to parse database file, reinitializing:', e);
    }
  }

  // Initial seed of sources
  const seededSources: Record<string, StoredSource> = {};
  const seenDomains = new Set<string>();

  for (const raw of SEED_SOURCES_RAW) {
    let domain = '';
    try {
      domain = new URL(raw.url).hostname.replace(/^www\./, '');
    } catch {
      domain = raw.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // Dedup: one row per domain (e.g. CBE and Awash Bank merged)
    if (seenDomains.has(domain)) {
      continue;
    }
    seenDomains.add(domain);

    const id = `src-${domain.replace(/[^a-z0-9]/g, '-')}`;
    const isIslamic = ISLAMIC_BANKS.some((b) => raw.name.toLowerCase().includes(b.toLowerCase()));
    const isPaywalled = PAYWALLED_DOMAINS.some((d) => domain.includes(d));

    let priority: 'P1' | 'P2' | 'P3' | 'OWN_BRAND' = 'P3';
    let fetchInterval = 1440; // 24h
    if (raw.group === 'OWN_BRAND') {
      priority = 'OWN_BRAND';
      fetchInterval = 60;
    } else if (raw.group === 'P1_ETHIOPIA_MEDIA_REG') {
      priority = 'P1';
      fetchInterval = 30;
    } else if (raw.group === 'P1_ETHIOPIAN_BANKS') {
      priority = 'P1';
      fetchInterval = 120;
    } else if (raw.group === 'P2_FINTECH_MEDIA' || raw.group === 'P2_AFRICA_MEDIA') {
      priority = 'P2';
      fetchInterval = 180;
    } else if (raw.group === 'P2_OFFICIAL') {
      priority = 'P2';
      fetchInterval = 240;
    }

    let category: StoredSource['category'] = 'Media';
    if (raw.name.includes('Bank') || raw.group.includes('BANKS')) category = 'Bank';
    else if (raw.name.includes('NBE') || raw.name.includes('ECMA') || raw.name.includes('Authority')) category = 'Regulator';
    else if (raw.name.includes('StockMarket') || raw.name.includes('PAPSS') || raw.name.includes('Switch')) category = 'Market Infra';

    seededSources[id] = {
      id,
      name: raw.name,
      url: raw.url,
      feed_url: '', // will be auto-discovered or set
      type: 'rss',
      category,
      language: 'en',
      reliability_tier: priority === 'P1' || priority === 'OWN_BRAND' || category === 'Regulator' || category === 'Bank' ? 1 : 2,
      fetch_interval: fetchInterval,
      css_selectors: 'article, .article-content, .entry-content, main',
      active: true,
      last_status: 'pending',
      group: raw.group,
      priority,
      is_islamic: isIslamic,
      is_paywalled: isPaywalled,
      items_count: 0,
    };
  }

  memoryDb = {
    sources: seededSources,
    articles: {},
    fetch_log: [],
    status: {
      last_sync_time: null,
      last_sync_status: 'idle',
      last_sync_error: null,
      total_items_today: 0,
      llm_calls_today: 0,
      llm_date: new Date().toISOString().split('T')[0],
    },
  };

  saveDb();
  return memoryDb;
}

export function saveDb(): void {
  if (!memoryDb) return;
  ensureDataDirectory();
  const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(memoryDb, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error('Failed to save database file atomically:', err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
  }
}

export function getRelevanceConfig(): RelevanceRuleConfig {
  if (memoryConfig) return memoryConfig;
  ensureDataDirectory();

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      memoryConfig = JSON.parse(data);
      if (memoryConfig) return memoryConfig;
    } catch (e) {
      console.error('Error loading relevance config:', e);
    }
  }

  memoryConfig = { ...DEFAULT_RELEVANCE_CONFIG };
  saveRelevanceConfig();
  return memoryConfig;
}

export function saveRelevanceConfig(): void {
  if (!memoryConfig) return;
  ensureDataDirectory();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(memoryConfig, null, 2), 'utf-8');
}

export function updateRelevanceWeights(type: 'star' | 'archive' | 'dismiss', sourceId: string, tags: string[]): void {
  const cfg = getRelevanceConfig();
  const delta = type === 'star' ? 1 : -0.5;

  cfg.sourceWeights[sourceId] = (cfg.sourceWeights[sourceId] || 0) + delta;
  for (const tag of tags) {
    const k = tag.toLowerCase();
    cfg.keywordWeights[k] = (cfg.keywordWeights[k] || 0) + delta * 0.5;
  }
  saveRelevanceConfig();
}
