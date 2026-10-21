// freshness.ts — only ingest/show articles published within the last N days.
// Key rule: use the PUBLISHED date, never "last updated" (old articles get re-touched and look new).

export const MAX_AGE_DAYS = 5;        // change here
export const ALLOW_UNDATED = false;   // false = drop items whose date cannot be found (recommended)
const DAY = 86_400_000;

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december';

function sane(d: Date, now = new Date()): Date | null {
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear(), ny = now.getUTCFullYear();
  // Ethiopian-calendar years (about Gregorian year minus 7/8) are ambiguous: treat as unknown, not "old"
  if (y === ny - 7 || y === ny - 8) return null;
  if (y < 2000 || y > ny + 1) return null;
  return d;
}

// ---------- extract the published date from fetched HTML (+ URL + text fallback) ----------
export function extractPublishedDate(html: string, url: string, text = ''): Date | null {
  const tries: Array<() => string | null> = [
    // 1. JSON-LD datePublished (NOT dateModified)
    () => html.match(/"datePublished"\s*:\s*"([^"]+)"/i)?.[1] ?? null,
    // 2. Open Graph / article meta
    () => html.match(/<meta[^>]+(?:property|name)=["'](?:article:published_time|og:published_time|pubdate|publishdate|publish-date|date|DC\.date\.issued)["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null,
    () => html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:article:published_time|og:published_time|pubdate)["']/i)?.[1] ?? null,
    // 3. itemprop / <time>
    () => html.match(/itemprop=["']datePublished["'][^>]*(?:content|datetime)=["']([^"']+)["']/i)?.[1] ?? null,
    () => html.match(/<time[^>]+datetime=["']([^"']+)["']/i)?.[1] ?? null,
    // 4. URL path /2026/10/21/ or /2026/10/
    () => { const m = url.match(/\/(20\d{2})[\/-](\d{1,2})(?:[\/-](\d{1,2}))?(?:\/|$|-)/); return m ? `${m[1]}-${m[2].padStart(2, '0')}-${(m[3] ?? '01').padStart(2, '0')}` : null; },
    // 5. Visible text: 2026-10-21 | Oct 21, 2026 | 21 October 2026
    () => text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] ?? null,
    () => text.match(new RegExp(`\\b((?:${MONTHS})\\.?\\s+\\d{1,2},?\\s+20\\d{2})\\b`, 'i'))?.[1] ?? null,
    () => text.match(new RegExp(`\\b(\\d{1,2}\\s+(?:${MONTHS})\\.?,?\\s+20\\d{2})\\b`, 'i'))?.[1] ?? null,
  ];
  for (const t of tries) {
    const raw = t();
    if (!raw) continue;
    const d = sane(new Date(raw));
    if (d) return d;
  }
  return null;
}

// ---------- the gate ----------
export interface FreshResult { ok: boolean; ageDays: number | null; reason: string; }

export function checkFresh(publishedAt?: string | Date | null, now = new Date(), maxDays = MAX_AGE_DAYS): FreshResult {
  if (!publishedAt) {
    return ALLOW_UNDATED
      ? { ok: true, ageDays: null, reason: 'undated (allowed)' }
      : { ok: false, ageDays: null, reason: 'no publish date found' };
  }
  const d = sane(publishedAt instanceof Date ? publishedAt : new Date(publishedAt), now);
  if (!d) return ALLOW_UNDATED
    ? { ok: true, ageDays: null, reason: 'unparseable date (allowed)' }
    : { ok: false, ageDays: null, reason: 'unparseable date' };

  const ageDays = (now.getTime() - d.getTime()) / DAY;
  if (ageDays < -1) return { ok: false, ageDays, reason: 'published in the future' };
  if (ageDays > maxDays) return { ok: false, ageDays: Math.round(ageDays * 10) / 10, reason: `too old (${Math.round(ageDays)}d > ${maxDays}d)` };
  return { ok: true, ageDays: Math.round(ageDays * 10) / 10, reason: 'fresh' };
}
