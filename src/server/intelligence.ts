import { GoogleGenAI, Type } from '@google/genai';
import { getDb, saveDb, StoredArticle, getRelevanceConfig } from './db.ts';
import { verifyLink } from './ingestion.ts';
import { THEME_PROMPT_BLOCK, sanitizeThemes, THEME_IDS } from '../themes.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Stage 1 keyword/entity matcher
export function passesStage1KeywordFilter(text: string): boolean {
  const config = getRelevanceConfig();
  const lower = text.toLowerCase();

  // Any stage 1 keyword match
  for (const kw of config.stage1Keywords) {
    if (lower.includes(kw.toLowerCase())) return true;
  }

  // Any competitor bank match
  for (const b of config.competitorBanks) {
    if (lower.includes(b.toLowerCase())) return true;
  }

  // Any Ethiopian entity match
  for (const e of config.ethiopiaEntities) {
    if (lower.includes(e.toLowerCase())) return true;
  }

  return false;
}

// Post-validation: every number, date, and named entity (capitalized multi-word tokens)
// in the summary must appear in raw_text; otherwise mark verification_status = "unverified".
export function validateSummaryAgainstRawText(summary: string, rawText: string): { valid: boolean; failedItems: string[] } {
  const rawLower = rawText.toLowerCase();
  const failed: string[] = [];

  // 1. Extract numbers (e.g. 15, 2.5%, $50M, 2026, 85%)
  const numberRegex = /\b\d+(?:[\.,]\d+)?%?(?:M|B|K|ETB|USD)?\b/gi;
  const numbersInSummary = summary.match(numberRegex) || [];
  for (const num of numbersInSummary) {
    // strip commas or currency symbols for matching
    const cleanNum = num.replace(/[$€£]/g, '').toLowerCase();
    if (!rawLower.includes(cleanNum)) {
      failed.push(`Number '${num}' not found in raw text`);
    }
  }

  // 2. Extract capitalized named entities (excluding start of sentence or common words)
  const words = summary.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    const word = words[i].replace(/[.,!?:;"'()]/g, '');
    if (
      word.length > 3 &&
      /^[A-Z][a-z]+$/.test(word) &&
      !['The', 'This', 'That', 'These', 'Those', 'With', 'From', 'After', 'Before', 'During'].includes(word)
    ) {
      if (!rawLower.includes(word.toLowerCase())) {
        failed.push(`Entity '${word}' not found in raw text`);
      }
    }
  }

  return {
    valid: failed.length === 0,
    failedItems: failed,
  };
}

export async function processArticleIntelligence(articleId: string): Promise<boolean> {
  const db = getDb();
  const article = db.articles[articleId];
  if (!article) return false;

  // Paywalled items: no full-text summary, label paywalled
  if (article.is_paywalled) {
    article.summary_ai = `[Paywalled Content] ${article.raw_text.slice(0, 300)}`;
    article.relevance_score = article.source_group.includes('P1') ? 7 : 5;
    saveDb();
    return true;
  }

  // Stage 1 filter: Check if text passes keyword threshold
  const combinedText = `${article.title_original} ${article.raw_text}`;
  const passesFilter = passesStage1KeywordFilter(combinedText);

  // If P3_GSIB or P2 and fails Stage 1, store without LLM summarization (cost control)
  if (!passesFilter && (article.source_group.startsWith('P3') || article.source_group.startsWith('P2'))) {
    article.relevance_score = 3;
    article.relevance_reason = 'Archived for reference; below Awash Bank Stage 1 priority threshold.';
    saveDb();
    return true;
  }

  // Cost control: daily LLM cap
  const today = new Date().toISOString().split('T')[0];
  if (db.status.llm_date !== today) {
    db.status.llm_date = today;
    db.status.llm_calls_today = 0;
  }
  const config = getRelevanceConfig();
  if (db.status.llm_calls_today >= config.dailyLlmCallCap) {
    article.summary_ai = article.raw_text.slice(0, 250);
    article.relevance_score = article.relevance_score || 5;
    article.relevance_reason = 'Daily AI quota limit reached; raw extract displayed.';
    saveDb();
    return false;
  }

  if (!process.env.GEMINI_API_KEY) {
    article.summary_ai = article.raw_text.slice(0, 250);
    saveDb();
    return false;
  }

  // Non-negotiable rules:
  // 1. LLM must NEVER produce headline, URL, publish date, or source name.
  // 2. LLM only summarizes, tags, and scores stored raw_text.
  // 3. Strict temperature 0-0.2, strict JSON output.
  const prompt = `You are a banking and treasury intelligence analyst for Awash Bank (Ethiopia).
Analyze ONLY the provided raw article text below. Do NOT hallucinate or import outside knowledge.
Strictly extract and summarize facts found directly in the text.

Article Raw Text:
"""
${article.raw_text.slice(0, 5000)}
"""

Produce JSON strictly adhering to:
- summary: 2 to 3 sentences summarizing the development using ONLY facts, numbers, and entities directly stated in the raw text.
${THEME_PROMPT_BLOCK}
- geography: Must be one of: "Global", "Africa", "Ethiopia", "Cross-border".
- category: Must be one of: "Product/Service Launch", "Partnership", "Technology Acquisition / Platform Deal", "Business Process Modernization / Automation", "Transformation Initiative / Strategy Announcement", "Funding / Valuation Signal".
- impactLevel: Must be one of: "High (large bank or systemic)", "Medium", "Watchlist".
- keyTakeaway: Concise 1-2 sentence executive briefing note explaining the modernization significance for Awash Bank change and treasury leadership.
- relevance_score: integer from 0 to 10 evaluating strategic significance to Awash Bank (Ethiopia's largest private bank, prioritizing FX reforms, core modernization, EthSwitch QR/A2A interoperability, digital channels, and NBE compliance).
- relevance_reason: 1 concise sentence explaining the score based strictly on the text.
- awash_implication: If relevance_score >= 7, provide a 1-sentence "So what for Awash Bank" strategy takeaway. If score < 7, leave this field empty string "".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.1, // Temperature 0-0.2
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            geography: { type: Type.STRING },
            category: { type: Type.STRING },
            impactLevel: { type: Type.STRING },
            keyTakeaway: { type: Type.STRING },
            relevance_score: { type: Type.INTEGER },
            relevance_reason: { type: Type.STRING },
            awash_implication: { type: Type.STRING },
          },
          required: [
            'summary',
            'tags',
            'geography',
            'category',
            'impactLevel',
            'keyTakeaway',
            'relevance_score',
            'relevance_reason',
            'awash_implication',
          ],
        },
      },
    });

    db.status.llm_calls_today++;

    const parsed = JSON.parse(response.text || '{}');
    const summary = parsed.summary || '';

    // Post-validation: check every number and named entity
    const validation = validateSummaryAgainstRawText(summary, article.raw_text);

    article.summary_ai = summary;
    const sanitized = sanitizeThemes(parsed.tags || parsed.themes);
    if (sanitized.length > 0) {
      article.tags = sanitized;
    }
    if (parsed.geography && ['Global', 'Africa', 'Ethiopia', 'Cross-border'].includes(parsed.geography)) {
      article.geography = parsed.geography as any;
    }
    if (
      parsed.category &&
      [
        'Product/Service Launch',
        'Partnership',
        'Technology Acquisition / Platform Deal',
        'Business Process Modernization / Automation',
        'Transformation Initiative / Strategy Announcement',
        'Funding / Valuation Signal',
      ].includes(parsed.category)
    ) {
      article.category = parsed.category as any;
    }
    if (parsed.impactLevel && ['High (large bank or systemic)', 'Medium', 'Watchlist'].includes(parsed.impactLevel)) {
      article.impact = parsed.impactLevel as any;
    }
    if (parsed.keyTakeaway) {
      article.takeaway = parsed.keyTakeaway;
    }

    article.relevance_score = typeof parsed.relevance_score === 'number' ? parsed.relevance_score : 6;
    article.relevance_reason = parsed.relevance_reason || '';
    if (article.relevance_score >= (config.awashImplicationThreshold || 7)) {
      article.awash_implication = parsed.awash_implication || '';
    } else {
      article.awash_implication = undefined;
    }

    // Mark verification status based on validation
    article.verification_status = validation.valid ? 'verified' : 'unverified';

    // Also perform HTTP link resolution check
    const linkCheck = await verifyLink(article.original_url, article.title_original);
    article.link_checked_at = new Date().toISOString();
    if (!linkCheck.ok) {
      article.verification_status = 'unverified';
    }

    saveDb();
    return true;
  } catch (err) {
    console.error(`Intelligence processing error for ${articleId}:`, err);
    article.summary_ai = article.raw_text.slice(0, 250);
    saveDb();
    return false;
  }
}

// Batch processor for unsummarized articles
export async function runIntelligenceBatch(limit = 10): Promise<number> {
  const db = getDb();
  const unsummarized = Object.values(db.articles)
    .filter((a) => !a.summary_ai && !a.is_paywalled)
    .slice(0, limit);

  let processed = 0;
  for (const art of unsummarized) {
    const success = await processArticleIntelligence(art.id);
    if (success) processed++;
  }
  return processed;
}
