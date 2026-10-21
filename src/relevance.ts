// relevance.ts — ingest only relevant articles.
// Pipeline: domain check -> per-source path rules -> hard URL/title blocks (with policy override)
//           -> rate-table detector -> weighted scoring -> Gemini gate (borderline only) -> dedup.
// Every drop is logged with a reason so you can audit and tune.

import { classifyThemes } from './themes';
import { matchEntities } from './entities';
import { checkFresh } from './freshness';

export interface SourceChannel {
  id: string;
  name: string;
  url: string;
  group: string;                 // e.g. 'Regulators', 'Ethiopian Banks', 'Africa Banks', 'Global Banks', 'Media'
  geography: 'Ethiopia' | 'Africa' | 'Cross-border' | 'Global';
  tier: 1 | 2 | 3;
  enabled: boolean;
  includePaths?: RegExp[];       // if set, URL must match one (e.g. /news|press|media/)
  excludePaths?: RegExp[];       // extra per-source blocks
}

export interface RawItem {
  sourceId: string;
  url: string;
  title: string;
  text?: string;                 // article body or snippet
  publishedAt?: string;
}

export interface Verdict {
  keep: boolean;
  borderline?: boolean;
  score: number;
  stage: string;
  reasons: string[];
}

// ---------- 1. Hard blocks ----------
const BLOCK_URL =
  /\/(careers?|jobs?|vacanc(?:y|ies)|recruit\w*|tenders?|bids?|procurement|exchange-rates?|forex-rates?|currency-?(?:converter|rates?)|rates?|calculator|atm|branch(?:es)?|locations?|contact(?:-us)?|terms|privacy|sitemap|tag|author|gallery|weather|sports?|horoscope|obituar\w*)(?:\/|$|\?|-)/i;

const BLOCK_TITLE =
  /(today'?s (?:exchange|forex|currency) rate|daily (?:exchange|forex) rate|exchange rates? (?:for|on|as of)|(?:usd|eur|gbp|birr|etb) (?:to|vs\.?|\/) (?:usd|eur|gbp|birr|etb)|buying and selling rate|currency converter|vacanc(?:y|ies)|job (?:opening|announcement|vacancy)|we(?:'re| are) hiring|recruitment|apply now|career opportunit|invitation (?:to|for) bid|tender notice|auction notice|obituar|condolence|public holiday|happy (?:new year|eid|easter|christmas)|congratulat\w+ on (?:the )?(?:birth|wedding)|horoscope|weather forecast|football|match report)/i;

// Policy / reform news about FX is relevant; a daily rate table is not.
const POLICY_OVERRIDE =
  /(directive|policy|reform|float|liberali[sz]\w*|framework|regulat\w+|monetary|imf|nbe (?:announce|issu|introduc)|circular|proclamation|market-based)/i;

// Rate-table detector: many currency codes + high digit density
function looksLikeRateTable(text: string): boolean {
  if (!text) return false;
  const codes = (text.match(/\b(USD|EUR|GBP|SAR|AED|CNY|JPY|KES|ZAR|CAD|AUD|CHF|ETB)\b/g) || []).length;
  const digits = (text.match(/\d/g) || []).length;
  const ratio = digits / Math.max(text.length, 1);
  return codes >= 4 && ratio > 0.12;
}

// ---------- 2. Scoring ----------
const SIGNALS: Array<[RegExp, number]> = [
  [/\b(launch(?:es|ed)?|unveil\w*|introduc\w+|rolls? out|rollout|go-?live|pilot)\b/i, 1.5],
  [/\b(partner\w*|collaborat\w+|mou|memorandum|alliance|joint venture)\b/i, 1.5],
  [/\b(acqui\w+|invest\w+|raises?|funding|valuation|stake)\b/i, 1.2],
  [/\b(core banking|platform|api|open banking|interoperab\w+|digital|fintech|mobile money|wallet)\b/i, 1.2],
  [/\b(automation|artificial intelligence|ai|agentic|genai|machine learning|rpa)\b/i, 1.5],
  [/\b(transformation|moderni[sz]\w+|migration|upgrade|re-?engineer\w+|operating model)\b/i, 1.5],
  [/\b(licen[cs]e|directive|regulation|supervis\w+|capital requirement|framework|strategy)\b/i, 1.0],
];
const NOISE: Array<[RegExp, number]> = [
  [/\b(salary|apply before|deadline|closing date|vacancy|cv)\b/i, -2],
  [/\b(daily rate|rate table|buying|selling rate|opening hours|branch hours)\b/i, -2],
  [/\b(sponsorship|charity|donat\w+|scholarship|csr)\b/i, -1],
];

export const THRESHOLDS = { keep: 5, borderline: 2.5 };

export function evaluate(item: RawItem, src?: SourceChannel): Verdict {
  const reasons: string[] = [];
  const title = item.title || '';
  const body = item.text || '';
  const hay = `${title}\n${body}`;
  const drop = (stage: string, why: string): Verdict =>
    ({ keep: false, score: 0, stage, reasons: [...reasons, why] });

  // Stage 0: grounding — link must belong to the source's domain (kills mislinked/fabricated items)
  try {
    if (src) {
      const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');
      if (!host(item.url).endsWith(host(src.url))) return drop('domain', `url host != source host (${host(item.url)})`);
    }
  } catch { return drop('domain', 'invalid url'); }

  // Stage 0.5: freshness — only articles published within the last MAX_AGE_DAYS (see freshness.ts)
  const fresh = checkFresh(item.publishedAt);
  if (!fresh.ok) return drop('freshness', fresh.reason);

  // Stage 1: per-source path rules
  if (src?.includePaths?.length && !src.includePaths.some(rx => rx.test(item.url)))
    return drop('source-path', 'url not in includePaths');
  if (src?.excludePaths?.some(rx => rx.test(item.url)))
    return drop('source-path', 'url matches excludePaths');

  // Stage 2: hard blocks, unless it is genuine policy news
  const policy = POLICY_OVERRIDE.test(hay);
  if (BLOCK_URL.test(item.url) && !policy) return drop('block-url', 'listing/utility page');
  if (BLOCK_TITLE.test(title) && !policy) return drop('block-title', 'rates/jobs/boilerplate title');

  // Stage 3: rate tables / data dumps
  if (looksLikeRateTable(body) && !policy) return drop('rate-table', 'currency table / data dump');

  // Stage 4: weighted score
  let score = 0;
  for (const [rx, w] of SIGNALS) if (rx.test(hay)) { score += w; reasons.push(`+${w} ${rx.source.slice(0, 24)}`); }
  for (const [rx, w] of NOISE) if (rx.test(hay)) { score += w; reasons.push(`${w} noise`); }

  const ents = matchEntities(hay);
  if (ents.length) { score += 2; reasons.push(`+2 entities: ${ents.slice(0, 3).join(',')}`); }

  const themes = classifyThemes(hay, src?.geography as any);
  if (themes.length) { score += Math.min(themes.length, 3) * 1.5; reasons.push(`+themes: ${themes.join(',')}`); }

  if (body.length >= 400) score += 1; else if (body.length > 0 && body.length < 150) { score -= 2; reasons.push('-2 too short'); }
  if (src?.tier === 1) score += 1;       // official sources get a small trust bump
  if (src?.tier === 3) score -= 1;       // social/unverified needs stronger evidence

  if (score >= THRESHOLDS.keep) return { keep: true, score, stage: 'score', reasons };
  if (score >= THRESHOLDS.borderline) return { keep: false, borderline: true, score, stage: 'score', reasons };
  return { keep: false, score, stage: 'score', reasons: [...reasons, 'below threshold'] };
}

// ---------- 3. Gemini gate (borderline items only) ----------
const MODEL = 'gemini-2.5-flash'; // set to the model your AI Studio project already uses

export async function llmGate(item: RawItem, apiKey: string): Promise<{ relevant: boolean; reason: string }> {
  const prompt = `You screen news for a bank-modernization intelligence feed (Awash Bank, Ethiopia).
RELEVANT: product/service launches, partnerships, technology or platform deals, process modernization,
transformation strategy, funding signals, and regulatory directives affecting banks (NBE, ECMA).
NOT RELEVANT: daily exchange-rate quotes, job ads, tenders, branch hours, CSR/charity, general politics,
sports, obituaries, ads, and pages with no concrete banking development.
Judge ONLY from the text below. If the text does not support relevance, answer false.

TITLE: ${item.title}
TEXT: ${(item.text || '').slice(0, 2500)}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: { relevant: { type: 'BOOLEAN' }, reason: { type: 'STRING' } },
            required: ['relevant', 'reason'],
          },
        },
      }),
    }
  );
  if (!res.ok) return { relevant: false, reason: `llm error ${res.status}` }; // fail closed
  const data = await res.json();
  try {
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch {
    return { relevant: false, reason: 'llm parse error' };
  }
}

// ---------- 4. Orchestrator ----------
const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export interface AuditRow { url: string; title: string; sourceId: string; decision: 'kept' | 'dropped'; stage: string; score: number; reasons: string[]; }

export async function ingest(
  items: RawItem[],
  sources: SourceChannel[],
  geminiKey?: string
): Promise<{ kept: RawItem[]; audit: AuditRow[] }> {
  const bySrc = new Map(sources.map(s => [s.id, s]));
  const seen = new Set<string>();
  const kept: RawItem[] = [];
  const audit: AuditRow[] = [];

  for (const item of items) {
    const src = bySrc.get(item.sourceId);
    if (!src || !src.enabled) continue;                 // respects the source on/off switch

    const key = normTitle(item.title);
    if (seen.has(key)) {
      audit.push({ url: item.url, title: item.title, sourceId: item.sourceId, decision: 'dropped', stage: 'dedup', score: 0, reasons: ['duplicate title'] });
      continue;
    }

    const v = evaluate(item, src);
    let keep = v.keep;
    let stage = v.stage;
    const reasons = [...v.reasons];

    if (!keep && v.borderline && geminiKey) {
      const g = await llmGate(item, geminiKey);
      keep = g.relevant; stage = 'llm-gate'; reasons.push(`llm: ${g.reason}`);
    }

    audit.push({ url: item.url, title: item.title, sourceId: item.sourceId, decision: keep ? 'kept' : 'dropped', stage, score: v.score, reasons });
    if (keep) { seen.add(key); kept.push(item); }
  }
  return { kept, audit };
}
