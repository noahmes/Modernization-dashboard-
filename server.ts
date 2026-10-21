import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getDb,
  saveDb,
  StoredArticle,
  updateRelevanceWeights,
  getRelevanceConfig,
} from './src/server/db.ts';
import { runIngestionBatch, ingestSource } from './src/server/ingestion.ts';
import { runIntelligenceBatch } from './src/server/intelligence.ts';
import { SUGGESTED_EXTRA_SOURCES } from './src/server/sourcesSeed.ts';
import { evaluate, AuditRow } from './src/relevance.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Database
const db = getDb();

// 1. GET /api/status - System and sync telemetry
app.get('/api/status', (_req, res) => {
  const currentDb = getDb();
  const cfg = getRelevanceConfig();
  const allArticles = Object.values(currentDb.articles);
  const sources = Object.values(currentDb.sources);

  const todayStr = new Date().toISOString().split('T')[0];
  const newToday = allArticles.filter((a) => a.fetched_at.startsWith(todayStr)).length;
  const healthySources = sources.filter((s) => s.last_status === 'ok').length;
  const errorSources = sources.filter((s) => s.last_status === 'error').length;

  res.json({
    lastSyncTime: currentDb.status.last_sync_time,
    lastSyncStatus: currentDb.status.last_sync_status,
    lastSyncError: currentDb.status.last_sync_error,
    totalArticles: allArticles.length,
    newToday,
    llmCallsToday: currentDb.status.llm_calls_today,
    dailyLlmCap: cfg.dailyLlmCallCap,
    totalSources: sources.length,
    healthySources,
    errorSources,
  });
});

// 2. GET /api/articles - Dashboard article feed
app.get('/api/articles', (req, res) => {
  const currentDb = getDb();
  let list = Object.values(currentDb.articles);

  const {
    status = 'active', // active, archived, starred, all
    group = 'ALL',
    search,
    tag,
    minScore,
    verifiedOnly,
    dateRange,
    sourceId,
  } = req.query as Record<string, string>;

  // Status filter
  if (status === 'active') {
    list = list.filter((a) => a.status !== 'archived');
  } else if (status === 'archived') {
    list = list.filter((a) => a.status === 'archived');
  } else if (status === 'starred') {
    list = list.filter((a) => a.status === 'starred');
  }

  // Group filter
  if (group && group !== 'ALL') {
    list = list.filter((a) => a.source_group === group);
  }

  // Source filter
  if (sourceId) {
    list = list.filter((a) => a.source_id === sourceId);
  }

  // Tag filter
  if (tag && tag !== 'ALL') {
    list = list.filter((a) => a.tags.includes(tag));
  }

  // Min Score
  if (minScore) {
    const min = Number(minScore);
    if (!isNaN(min)) {
      list = list.filter((a) => a.relevance_score >= min);
    }
  }

  // Verified only
  if (verifiedOnly === 'true') {
    list = list.filter((a) => a.verification_status === 'verified');
  }

  // Date range filter
  if (dateRange) {
    const now = new Date().getTime();
    if (dateRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter((a) => a.fetched_at.startsWith(today));
    } else if (dateRange === 'this_week') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((a) => new Date(a.published_at).getTime() >= sevenDaysAgo);
    } else if (dateRange === 'last_14_days') {
      const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
      list = list.filter((a) => new Date(a.published_at).getTime() >= fourteenDaysAgo);
    }
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.title_original.toLowerCase().includes(q) ||
        (a.summary_ai && a.summary_ai.toLowerCase().includes(q)) ||
        a.raw_text.toLowerCase().includes(q) ||
        a.source_name.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sort: most recent publish date first
  list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  res.json({ success: true, count: list.length, articles: list });
});

// 3. GET /api/alerts - P1 Alert queue (NBE directives, ECMA notices, Awash/CBE/Dashen/Abyssinia)
app.get('/api/alerts', (_req, res) => {
  const currentDb = getDb();
  const alerts = Object.values(currentDb.articles)
    .filter((a) => {
      if (a.status === 'archived') return false;
      if (a.is_nbe_alert) return true;
      const lower = `${a.title_original} ${a.source_name} ${(a.tags || []).join(' ')}`.toLowerCase();
      return (
        lower.includes('nbe') ||
        lower.includes('ecma') ||
        lower.includes('national bank of ethiopia') ||
        lower.includes('directive') ||
        lower.includes('circular') ||
        lower.includes('capital market') ||
        a.source_name.includes('National Bank of Ethiopia') ||
        a.source_name.includes('ECMA') ||
        a.tags?.includes('regulatory_directives')
      );
    })
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  res.json({ success: true, count: alerts.length, alerts });
});

// 4. GET /api/own-brand - Awash Bank dedicated panel
app.get('/api/own-brand', (_req, res) => {
  const currentDb = getDb();
  const ownBrandItems = Object.values(currentDb.articles)
    .filter((a) => a.source_group === 'OWN_BRAND' || a.source_name.includes('Awash'))
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  res.json({ success: true, count: ownBrandItems.length, items: ownBrandItems });
});

// 5. GET /api/article/:id/raw - Cached copy snapshot
app.get('/api/article/:id/raw', (req, res) => {
  const currentDb = getDb();
  const article = currentDb.articles[req.params.id];
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  res.json({
    id: article.id,
    title: article.title_original,
    originalUrl: article.original_url,
    publishedAt: article.published_at,
    fetchedAt: article.fetched_at,
    sourceName: article.source_name,
    rawText: article.raw_text,
    contentHash: article.content_hash,
    verificationStatus: article.verification_status,
  });
});

// 6. POST /api/article/:id/action - Star / Archive / Review with feedback weights
app.post('/api/article/:id/action', (req, res) => {
  const { action } = req.body as { action: 'star' | 'archive' | 'review' };
  const currentDb = getDb();
  const article = currentDb.articles[req.params.id];
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  if (action === 'star') {
    article.status = article.status === 'starred' ? 'reviewed' : 'starred';
    updateRelevanceWeights('star', article.source_id, article.tags);
  } else if (action === 'archive') {
    article.status = 'archived';
    updateRelevanceWeights('archive', article.source_id, article.tags);
  } else if (action === 'review') {
    article.status = 'reviewed';
  }

  saveDb();
  res.json({ success: true, status: article.status });
});

// 7. GET /api/sources - Source health table
app.get('/api/sources', (_req, res) => {
  const currentDb = getDb();
  const sources = Object.values(currentDb.sources).sort((a, b) => {
    // Priority order: P1 > OWN_BRAND > P2 > P3
    const order: Record<string, number> = { P1: 1, OWN_BRAND: 2, P2: 3, P3: 4 };
    return (order[a.priority] || 5) - (order[b.priority] || 5);
  });

  const logs = currentDb.fetch_log.slice(0, 30);
  res.json({ success: true, count: sources.length, sources, recentLogs: logs });
});

// 8. POST /api/sync - Run ingestion cycle
app.post('/api/sync', async (req, res) => {
  const { group = 'ALL', pausedIds = [] } = req.body || {};
  try {
    const ingestResult = await runIngestionBatch(group, pausedIds);
    // Trigger intelligence pass on newly ingested items
    await runIntelligenceBatch(8);
    res.json({ success: true, ...ingestResult });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. POST /api/sync/source/:id - Poll single source
app.post('/api/sync/source/:id', async (req, res) => {
  const { paused = false } = req.body || {};
  if (paused) {
    return res.status(400).json({ error: 'Source is currently paused' });
  }
  try {
    const result = await ingestSource(req.params.id);
    await runIntelligenceBatch(4);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. GET /api/briefing - Exportable Word/PPT-ready text grouped by theme
app.get('/api/briefing', (_req, res) => {
  const currentDb = getDb();
  const articles = Object.values(currentDb.articles)
    .filter((a) => a.status !== 'archived')
    .sort((a, b) => b.relevance_score - a.relevance_score);

  // Group by primary theme tag
  const grouped: Record<string, StoredArticle[]> = {};
  for (const art of articles.slice(0, 25)) {
    const primaryTag = art.tags[0] || 'Strategic Modernization';
    if (!grouped[primaryTag]) grouped[primaryTag] = [];
    grouped[primaryTag].push(art);
  }

  const dateCompiled = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let text = `AWASH BANK | EXECUTIVE INTELLIGENCE BRIEFING\nCompiled: ${dateCompiled}\nPrepared for: Change, Treasury & Digital Strategy Committee\n\n`;

  text += `=========================================================\n`;
  text += `1. HIGH-PRIORITY NBE DIRECTIVES & SYSTEMIC ALERTS\n`;
  text += `=========================================================\n`;

  const priorityAlerts = articles.filter((a) => a.is_nbe_alert).slice(0, 5);
  if (priorityAlerts.length === 0) {
    text += `(No critical regulatory directives active during this surveillance cycle)\n\n`;
  } else {
    for (const a of priorityAlerts) {
      text += `• ${a.title_original}\n`;
      text += `  Source: ${a.source_name} | Published: ${a.published_at.split('T')[0]}\n`;
      text += `  Original Link: ${a.original_url}\n`;
      if (a.summary_ai) text += `  Summary: ${a.summary_ai}\n`;
      if (a.awash_implication) text += `  Awash Implication: ${a.awash_implication}\n`;
      text += `\n`;
    }
  }

  text += `=========================================================\n`;
  text += `2. DEVELOPMENTS GROUPED BY MODERNIZATION THEME\n`;
  text += `=========================================================\n`;

  for (const [theme, themeArticles] of Object.entries(grouped)) {
    text += `\n[ ${theme.toUpperCase()} ]\n`;
    for (const a of themeArticles) {
      text += `• [Score: ${a.relevance_score}/10 | ${a.verification_status.toUpperCase()}] ${a.title_original}\n`;
      text += `  Source: ${a.source_name} (${a.source_group}) <${a.original_url}>\n`;
      if (a.summary_ai) text += `  Summary: ${a.summary_ai}\n`;
      if (a.awash_implication) text += `  So What for Awash: ${a.awash_implication}\n`;
      if (a.syndicated_sources.length > 0) {
        text += `  Also syndicated via: ${a.syndicated_sources.map((s) => s.source_name).join(', ')}\n`;
      }
      text += `\n`;
    }
  }

  res.json({ success: true, briefingText: text });
});

// 11. GET /api/suggested-sources - Extra discoverable sources
app.get('/api/suggested-sources', (_req, res) => {
  const currentDb = getDb();
  // Filter out any already added
  const existingUrls = new Set(Object.values(currentDb.sources).map((s) => s.url));
  const suggested = SUGGESTED_EXTRA_SOURCES.filter((s) => !existingUrls.has(s.url));
  res.json({ success: true, suggested });
});

// 12. POST /api/suggested-sources/enable - Add extra source
app.post('/api/suggested-sources/enable', (req, res) => {
  const { name, url, group = 'P2_OFFICIAL' } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL required' });
  }

  const currentDb = getDb();
  const domain = new URL(url).hostname.replace(/^www\./, '');
  const id = `src-extra-${domain.replace(/[^a-z0-9]/g, '-')}`;

  currentDb.sources[id] = {
    id,
    name,
    url,
    feed_url: '',
    type: 'rss',
    category: 'Regulator',
    language: 'en',
    reliability_tier: 1,
    fetch_interval: 180,
    css_selectors: 'article, main',
    active: true,
    last_status: 'pending',
    group: group as any,
    priority: 'P2',
    items_count: 0,
  };

  saveDb();
  res.json({ success: true, source: currentDb.sources[id] });
});

// 12. GET /api/relevance/audit - Retrieve audit trail of dropped/kept items
app.get('/api/relevance/audit', (_req, res) => {
  const currentDb = getDb();
  res.json({
    success: true,
    count: (currentDb.relevance_audit || []).length,
    audit: currentDb.relevance_audit || [],
  });
});

// 13. POST /api/relevance/evaluate - Test raw item against relevance rules
app.post('/api/relevance/evaluate', (req, res) => {
  const { item, source } = req.body || {};
  if (!item || !item.title) {
    return res.status(400).json({ error: 'Item with title is required' });
  }
  try {
    const verdict = evaluate(item, source);
    res.json({ success: true, verdict });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Background ingestion runner (every 30 mins)
let backgroundTimer: NodeJS.Timeout | null = null;
function startBackgroundScheduler() {
  if (backgroundTimer) clearInterval(backgroundTimer);
  backgroundTimer = setInterval(async () => {
    console.log('[Scheduler] Running scheduled 30-min ingestion pass...');
    try {
      await runIngestionBatch('P1_ETHIOPIA_MEDIA_REG');
      await runIngestionBatch('OWN_BRAND');
      await runIntelligenceBatch(5);
    } catch (e) {
      console.error('[Scheduler] Error in scheduled run:', e);
    }
  }, 30 * 60 * 1000);
}

// Initial warm-up ingestion if database is fresh
async function warmupIngestIfEmpty() {
  const currentDb = getDb();
  const count = Object.keys(currentDb.articles).length;
  if (count === 0) {
    console.log('[Warmup] Initial database empty. Fetching live feeds from P1 and Media...');
    try {
      // Ingest high-signal Ethiopian media, official feeds, and banking news
      await runIngestionBatch('P1_ETHIOPIA_MEDIA_REG');
      await runIngestionBatch('OWN_BRAND');
      await runIngestionBatch('P2_AFRICA_MEDIA');
      await runIntelligenceBatch(6);
      console.log('[Warmup] Initial ingestion completed.');
    } catch (e) {
      console.error('[Warmup] Error during initial ingestion:', e);
    }
  }
}

// Setup Vite or static serving
async function startServer() {
  startBackgroundScheduler();
  // Warm up asynchronously
  warmupIngestIfEmpty();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Awash Modernization Monitor server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
