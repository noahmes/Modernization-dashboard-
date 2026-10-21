// themes.ts — drop into the AI Studio project and import where the Themes filter,
// classifier and Gemini prompt are defined. Replaces the old 8-theme list.

export type ThemeId =
  | 'payments_cards' | 'mobile_money_wallets' | 'interoperability_switching'
  | 'core_composable' | 'cloud_infra_sovereignty' | 'data_analytics_credit'
  | 'ai_agentic' | 'process_automation_opmodel'
  | 'open_banking_a2a' | 'digital_identity_kyc' | 'cx_channels'
  | 'cross_border_remittance' | 'trade_finance_digital' | 'fx_monetary_reform'
  | 'regulatory_directives' | 'fraud_cyber_aml'
  | 'agency_inclusion' | 'digital_lending_sme' | 'working_capital_o2c'
  | 'treasury_alm_capital_markets' | 'market_liberalization_ma' | 'islamic_banking';

export type ThemeCluster =
  | 'Payments & Channels' | 'Technology & Data' | 'Customer & Identity'
  | 'Cross-border, FX & Regulation' | 'Growth & Balance Sheet';

export interface Theme {
  id: ThemeId;
  label: string;
  cluster: ThemeCluster;
  chip: string;          // Tailwind classes for the filter chip / badge
  keywords: string[];    // lowercase; matched against title + summary
  ethiopiaKeywords?: string[]; // extra boost when geography = Ethiopia
}

export const THEMES: Theme[] = [
  // ---- Payments & Channels ----
  { id: 'payments_cards', label: 'Payments / Cards', cluster: 'Payments & Channels',
    chip: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700/50',
    keywords: ['payment', 'card', 'pos', 'qr', 'acquiring', 'issuing', 'visa', 'mastercard', 'instant payment', 'merchant', 'e-commerce'],
    ethiopiaKeywords: ['ethswitch', 'cbe birr', 'e-birr'] },
  { id: 'mobile_money_wallets', label: 'Mobile Money / Wallets / Super-apps', cluster: 'Payments & Channels',
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-700/50',
    keywords: ['mobile money', 'wallet', 'super app', 'super-app', 'ussd', 'm-pesa', 'mpesa', 'agent wallet'],
    ethiopiaKeywords: ['telebirr', 'm-pesa ethiopia', 'safaricom ethiopia', 'ethio telecom', 'awash birr'] },
  { id: 'interoperability_switching', label: 'Interoperability & Payment Rails', cluster: 'Payments & Channels',
    chip: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-700/50',
    keywords: ['interoperab', 'switch', 'rtgs', 'ach', 'clearing', 'settlement', 'papss', 'instant payment system', 'national payment system', 'fast payment'],
    ethiopiaKeywords: ['ethswitch', 'epss', 'national payment system proclamation'] },
  { id: 'cx_channels', label: 'Customer Experience / Digital Channels', cluster: 'Payments & Channels',
    chip: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-700/50',
    keywords: ['mobile banking', 'internet banking', 'omnichannel', 'branch transformation', 'customer journey', 'chatbot', 'contact centre', 'contact center', 'super app', 'digital channel', 'app launch'] },

  // ---- Technology & Data ----
  { id: 'core_composable', label: 'Core Banking / Composable', cluster: 'Technology & Data',
    chip: 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-700/50',
    keywords: ['core banking', 'core system', 'composable', 'microservices', 'api-first', 'modular', 'temenos', 'finacle', 'flexcube', 'thought machine', 'mambu', 'oracle fss', 'core replacement', 'core migration'] },
  { id: 'cloud_infra_sovereignty', label: 'Cloud / Infrastructure / Data Sovereignty', cluster: 'Technology & Data',
    chip: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-700/50',
    keywords: ['cloud', 'data centre', 'data center', 'disaster recovery', 'data localization', 'data localisation', 'data residency', 'sovereign', 'hybrid cloud', 'infrastructure', 'uptime', 'outage'],
    ethiopiaKeywords: ['data protection proclamation', 'ethiotelecom data centre'] },
  { id: 'data_analytics_credit', label: 'Data / Analytics / Credit Scoring', cluster: 'Technology & Data',
    chip: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/70 dark:text-fuchsia-300 dark:border-fuchsia-700/50',
    keywords: ['data platform', 'analytics', 'data lake', 'credit scoring', 'credit bureau', 'alternative data', 'customer 360', 'data governance', 'business intelligence', 'mis reporting'],
    ethiopiaKeywords: ['credit reference', 'credit information'] },
  { id: 'ai_agentic', label: 'AI / Agentic', cluster: 'Technology & Data',
    chip: 'bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300 dark:border-pink-700/50',
    keywords: ['artificial intelligence', ' ai ', 'ai-', 'genai', 'generative ai', 'agentic', 'llm', 'copilot', 'machine learning', 'ai agent', 'automation agent'] },
  { id: 'process_automation_opmodel', label: 'Process Automation / Operating Model', cluster: 'Technology & Data',
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700/50',
    keywords: ['rpa', 'workflow', 'straight-through', 'stp', 'process automation', 'operating model', 'back office', 'back-office', 'digitization', 'digitisation', 'lean', 'target operating model', 'as-is', 'to-be', 'reengineering', 're-engineering', 'shared services'] },

  // ---- Customer & Identity ----
  { id: 'open_banking_a2a', label: 'Open Banking / A2A', cluster: 'Customer & Identity',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/50',
    keywords: ['open banking', 'open finance', 'account-to-account', 'a2a', 'pay by bank', 'api marketplace', 'third-party provider', 'banking-as-a-service', 'baas', 'embedded finance', 'sandbox'] },
  { id: 'digital_identity_kyc', label: 'Digital ID / KYC / Onboarding', cluster: 'Customer & Identity',
    chip: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-700/50',
    keywords: ['kyc', 'ekyc', 'e-kyc', 'onboarding', 'digital identity', 'biometric', 'national id', 'customer due diligence', 'video kyc', 'account opening'],
    ethiopiaKeywords: ['fayda', 'national id program', 'nidp'] },

  // ---- Cross-border, FX & Regulation ----
  { id: 'cross_border_remittance', label: 'Cross-border / Remittance', cluster: 'Cross-border, FX & Regulation',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/50',
    keywords: ['remittance', 'cross-border', 'cross border', 'money transfer', 'swift', 'diaspora', 'correspondent', 'nostro', 'afcfta', 'papss', 'western union', 'moneygram'] },
  { id: 'trade_finance_digital', label: 'Trade Finance & Digital Trade', cluster: 'Cross-border, FX & Regulation',
    chip: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-700/50',
    keywords: ['trade finance', 'letter of credit', 'lc ', 'bank guarantee', 'documentary', 'supply chain finance', 'export finance', 'import', 'afreximbank', 'trade platform', 'electronic bill of lading'],
    ethiopiaKeywords: ['ecx', 'commodity exchange', 'export proceeds', 'djibouti corridor'] },
  { id: 'fx_monetary_reform', label: 'FX & Monetary Reform', cluster: 'Cross-border, FX & Regulation',
    chip: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/70 dark:text-yellow-300 dark:border-yellow-700/50',
    keywords: ['foreign exchange', 'fx', 'exchange rate', 'devaluation', 'float', 'forex', 'monetary policy', 'interest rate', 'inflation', 'imf programme', 'imf program'],
    ethiopiaKeywords: ['birr', 'nbe fx', 'market-based exchange rate', 'fx directive', 'fx auction'] },
  { id: 'regulatory_directives', label: 'Regulation & Directives', cluster: 'Cross-border, FX & Regulation',
    chip: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 dark:border-red-700/50',
    keywords: ['regulation', 'directive', 'circular', 'central bank', 'compliance', 'licence', 'license', 'capital requirement', 'supervision', 'basel', 'proclamation', 'sandbox'],
    ethiopiaKeywords: ['nbe', 'national bank of ethiopia', 'ecma', 'ethiopian capital market authority', 'directive no', 'fis/'] },
  { id: 'fraud_cyber_aml', label: 'Fraud / Cyber / AML', cluster: 'Cross-border, FX & Regulation',
    chip: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600/50',
    keywords: ['fraud', 'cyber', 'ransomware', 'breach', 'aml', 'cft', 'anti-money laundering', 'sanction', 'scam', 'phishing', 'cybersecurity', 'resilience', 'fatf', 'transaction monitoring'] },

  // ---- Growth & Balance Sheet ----
  { id: 'agency_inclusion', label: 'Agency Banking & Financial Inclusion', cluster: 'Growth & Balance Sheet',
    chip: 'bg-lime-100 text-lime-800 dark:bg-lime-950/70 dark:text-lime-300 dark:border-lime-700/50',
    keywords: ['agent banking', 'agency banking', 'financial inclusion', 'rural', 'unbanked', 'microfinance', 'women', 'last mile', 'sub-agent', 'branchless'],
    ethiopiaKeywords: ['financial inclusion strategy', 'nfis', 'rural banking'] },
  { id: 'digital_lending_sme', label: 'Digital Lending / SME Finance', cluster: 'Growth & Balance Sheet',
    chip: 'bg-green-100 text-green-800 dark:bg-green-950/70 dark:text-green-300 dark:border-green-700/50',
    keywords: ['digital lending', 'digital loan', 'bnpl', 'buy now pay later', 'sme', 'msme', 'microloan', 'credit line', 'collateral', 'asset finance', 'agri finance', 'value chain finance'] },
  { id: 'working_capital_o2c', label: 'Working Capital / Order-to-Cash', cluster: 'Growth & Balance Sheet',
    chip: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600/50',
    keywords: ['working capital', 'order-to-cash', 'order to cash', 'receivables', 'invoice', 'cash management', 'liquidity management', 'virtual account', 'reconciliation', 'collections', 'treasury management'] },
  { id: 'treasury_alm_capital_markets', label: 'Treasury / ALM / Capital Markets', cluster: 'Growth & Balance Sheet',
    chip: 'bg-blue-200 text-blue-900 dark:bg-blue-900/70 dark:text-blue-200 dark:border-blue-700/50',
    keywords: ['treasury', 'alm', 'asset liability', 'liquidity', 'interbank', 'bond', 't-bill', 'treasury bill', 'securities', 'stock exchange', 'capital market', 'market risk', 'yield', 'repo', 'derivatives'],
    ethiopiaKeywords: ['esx', 'ethiopian securities exchange', 'ecma', 'interbank market', 'nbe bill'] },
  { id: 'market_liberalization_ma', label: 'Market Liberalization / Foreign Entry / M&A', cluster: 'Growth & Balance Sheet',
    chip: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600/50',
    keywords: ['foreign bank', 'market entry', 'liberalization', 'liberalisation', 'merger', 'acquisition', 'stake', 'consolidation', 'minimum capital', 'new entrant', 'fintech licence', 'neo bank', 'neobank', 'ipo', 'rights issue'],
    ethiopiaKeywords: ['foreign banks ethiopia', 'banking proclamation', 'capital increase'] },
  { id: 'islamic_banking', label: 'Islamic / Interest-Free Banking', cluster: 'Growth & Balance Sheet',
    chip: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-600/50',
    keywords: ['islamic banking', 'interest-free', 'sharia', 'shari\'ah', 'sukuk', 'murabaha', 'takaful', 'ifb window', 'islamic window'],
    ethiopiaKeywords: ['interest free banking', 'ifb'] },
];

// Map old labels/ids so archived items and saved filters keep working.
export const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  'Payments / Cards': 'payments_cards',
  'Core Banking / Composable': 'core_composable',
  'AI / Agentic': 'ai_agentic',
  'Open Banking / A2A': 'open_banking_a2a',
  'Cross-border / Remittance': 'cross_border_remittance',
  'FX / Regulatory Response': 'fx_monetary_reform', // review: items may also need regulatory_directives
  'KYC / Onboarding': 'digital_identity_kyc',
  'Working Capital / Order-to-Cash': 'working_capital_o2c',
};

export const THEME_BY_ID: Record<ThemeId, Theme> =
  Object.fromEntries(THEMES.map(t => [t.id, t])) as Record<ThemeId, Theme>;

export const THEME_IDS = THEMES.map(t => t.id);

// ---- Fallback keyword classifier (use when Gemini fails or as a sanity check) ----
export function classifyThemes(
  text: string,
  geography?: 'Ethiopia' | 'Africa' | 'Cross-border' | 'Global',
  maxThemes = 3
): ThemeId[] {
  const hay = ` ${text.toLowerCase()} `;
  const scored = THEMES.map(t => {
    let score = 0;
    for (const k of t.keywords) if (hay.includes(k)) score += 1;
    if (geography === 'Ethiopia' && t.ethiopiaKeywords) {
      for (const k of t.ethiopiaKeywords) if (hay.includes(k)) score += 2;
    }
    return { id: t.id, score };
  }).filter(s => s.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxThemes).map(s => s.id);
}

// ---- Gemini: constrain output to the taxonomy ----
export const THEME_PROMPT_BLOCK = `
Assign 1 to 3 themes to the item. Use ONLY these theme ids, exactly as written:
${THEMES.map(t => `- ${t.id}: ${t.label}`).join('\n')}
Rules:
- Pick themes only if the article text supports them. Do not infer from general knowledge.
- If nothing fits, return an empty array. Never invent a theme id.
- For Ethiopia items, prefer regulatory_directives, fx_monetary_reform, digital_identity_kyc,
  agency_inclusion or market_liberalization_ma when the text clearly supports them.
`;

// Use as generationConfig.responseSchema (Gemini API, JSON mode)
export const THEME_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    themes: {
      type: 'ARRAY',
      items: { type: 'STRING', enum: THEME_IDS },
    },
  },
  required: ['themes'],
};

// Validate whatever Gemini returns before saving
export function sanitizeThemes(raw: unknown): ThemeId[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(x => (typeof x === 'string' ? (LEGACY_THEME_MAP[x] ?? x) : ''))
    .filter((x): x is ThemeId => (THEME_IDS as string[]).includes(x as ThemeId))
    .slice(0, 3) as ThemeId[];
}
