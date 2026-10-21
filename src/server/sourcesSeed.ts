export interface SeedSource {
  id: string;
  name: string;
  url: string;
  feedUrl?: string;
  group:
    | 'P1_ETHIOPIA_MEDIA_REG'
    | 'P1_ETHIOPIAN_BANKS'
    | 'OWN_BRAND'
    | 'P2_FINTECH_MEDIA'
    | 'P2_AFRICA_MEDIA'
    | 'P2_OFFICIAL'
    | 'P3_AFRICAN_PEER_BANKS'
    | 'P3_GSIB';
  category: 'Media' | 'Bank' | 'Regulator' | 'Market Infra';
  fetchIntervalMinutes: number;
  isIslamic?: boolean;
  isPaywalled?: boolean;
}

export const SEED_SOURCES_RAW: Array<{ name: string; url: string; group: SeedSource['group'] }> = [
  { name: 'Capital Ethiopia', url: 'https://capitalethiopia.com', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'Ethiopian Business Review', url: 'https://ethiopianbusinessreview.net', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'StockMarket.et', url: 'https://www.stockmarket.et', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'The Reporter Ethiopia', url: 'https://www.thereporterethiopia.com', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'New Business Ethiopia', url: 'https://newbusinessethiopia.com', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'ET Business View', url: 'https://etbusinessview.com', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'Addis Fortune', url: 'https://addisfortune.news', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'National Bank of Ethiopia (NBE)', url: 'https://nbe.gov.et', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'Ethiopian Capital Market Authority (ECMA)', url: 'https://ecma.gov.et', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'BirrMetrics', url: 'https://birrmetrics.com', group: 'P1_ETHIOPIA_MEDIA_REG' },
  { name: 'Commercial Bank of Ethiopia (CBE)', url: 'https://www.combanketh.et', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Bank of Abyssinia', url: 'https://www.bankofabyssinia.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Dashen Bank', url: 'https://dashenbanksc.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Cooperative Bank of Oromia', url: 'https://coopbankoromia.com.et', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Hibret Bank', url: 'https://www.hibretbank.com.et', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Wegagen Bank', url: 'https://www.wegagen.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Nib International Bank', url: 'https://www.nibbanksc.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Oromia Bank', url: 'https://www.oromiabank.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Zemen Bank', url: 'https://www.zemenbank.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Abay Bank', url: 'https://www.abaybank.com.et', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Bunna International Bank', url: 'https://www.bunnabanksc.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Berhan Bank', url: 'https://berhanbanksc.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Lion International Bank (Anbesa)', url: 'https://anbesabank.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Enat Bank', url: 'https://www.enatbanksc.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Addis International Bank', url: 'https://www.addisbanksc.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Global Bank Ethiopia', url: 'https://www.globalbankethiopia.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Amhara Bank', url: 'https://www.amharabank.com.et', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Siinqee Bank', url: 'https://www.siinqeebank.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Hijra Bank', url: 'https://www.hijra-bank.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'ZamZam Bank', url: 'https://v2.zamzambank.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Gadaa Bank', url: 'https://gadaabank.com.et', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Shabelle Bank', url: 'https://www.shabellebank.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Development Bank of Ethiopia (DBE)', url: 'https://www.dbe.com.et', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Tsedey / Tsehay Bank', url: 'https://tsehaybank.com.et', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Goh Betoch Bank', url: 'https://gohbetbank.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Ahadu Bank', url: 'https://ahadubank.com', group: 'P1_ETHIOPIAN_BANKS' },
  { name: 'Awash Bank News', url: 'https://awashbank.com/news', group: 'OWN_BRAND' },
  { name: 'FinTech Futures', url: 'https://www.fintechfutures.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'Banking Dive', url: 'https://www.bankingdive.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'Finextra', url: 'https://www.finextra.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'The Financial Brand', url: 'https://thefinancialbrand.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'Tearsheet', url: 'https://tearsheet.co', group: 'P2_FINTECH_MEDIA' },
  { name: 'American Banker', url: 'https://www.americanbanker.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'FinTech Magazine', url: 'https://fintechmagazine.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'This Week in Fintech', url: 'https://www.thisweekinfintech.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'TechCrunch Fintech', url: 'https://techcrunch.com/tag/fintech', group: 'P2_FINTECH_MEDIA' },
  { name: 'Forbes Fintech', url: 'https://www.forbes.com/fintech', group: 'P2_FINTECH_MEDIA' },
  { name: 'Central Banking', url: 'https://www.centralbanking.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'PYMNTS', url: 'https://www.pymnts.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'IBS Intelligence', url: 'https://ibsintelligence.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'The Banker', url: 'https://www.thebanker.com', group: 'P2_FINTECH_MEDIA' },
  { name: 'BusinessDay', url: 'https://businessday.ng', group: 'P2_AFRICA_MEDIA' },
  { name: 'TechCabal', url: 'https://techcabal.com', group: 'P2_AFRICA_MEDIA' },
  { name: 'Disrupt Africa', url: 'https://disruptafrica.com', group: 'P2_AFRICA_MEDIA' },
  { name: 'African Business', url: 'https://african.business', group: 'P2_AFRICA_MEDIA' },
  { name: 'How We Made It in Africa', url: 'https://www.howwemadeitinafrica.com', group: 'P2_AFRICA_MEDIA' },
  { name: 'APO Group / Africa Newsroom', url: 'https://www.africa-newsroom.com', group: 'P2_AFRICA_MEDIA' },
  { name: 'The Africa Report', url: 'https://www.theafricareport.com', group: 'P2_AFRICA_MEDIA' },
  { name: 'CIO Africa', url: 'https://cioafrica.co', group: 'P2_AFRICA_MEDIA' },
  { name: 'Kenyan Wall Street', url: 'https://kenyanwallstreet.com', group: 'P2_AFRICA_MEDIA' },
  { name: 'TechAfrica News', url: 'https://techafricanews.com', group: 'P2_AFRICA_MEDIA' },
  { name: 'IT News Africa', url: 'https://www.itnewsafrica.com', group: 'P2_AFRICA_MEDIA' },
  { name: 'Afreximbank', url: 'https://www.afreximbank.com', group: 'P2_OFFICIAL' },
  { name: 'PAPSS', url: 'https://papss.com', group: 'P2_OFFICIAL' },
  { name: 'Standard Bank Group', url: 'https://www.standardbank.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'National Bank of Egypt', url: 'https://www.nbe.com.eg', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Absa Group', url: 'https://www.absa.africa', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'FirstRand (FNB / RMB)', url: 'https://www.firstrand.co.za', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Nedbank', url: 'https://www.nedbank.co.za', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Banque Misr', url: 'https://www.banquemisr.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Attijariwafa Bank', url: 'https://www.attijariwafabank.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Investec', url: 'https://www.investec.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Banque Centrale Populaire (BCP)', url: 'https://www.groupebcp.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Bank of Africa (BMCE)', url: 'https://www.bankofafrica.ma', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Access Bank', url: 'https://www.accessbankplc.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Ecobank Transnational (ETI)', url: 'https://www.ecobank.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Commercial International Bank (CIB)', url: 'https://www.cibeg.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'United Bank for Africa (UBA)', url: 'https://www.ubagroup.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Zenith Bank', url: 'https://www.zenithbank.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'First Bank of Nigeria', url: 'https://www.firstbanknigeria.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'KCB Group', url: 'https://kcbgroup.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Equity Group Holdings', url: 'https://equitygroupholdings.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Mauritius Commercial Bank', url: 'https://www.mcb.mu', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Capitec Bank', url: 'https://www.capitecbank.co.za', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Guaranty Trust Bank (GTBank / GTCO)', url: 'https://www.gtbank.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Co-operative Bank of Kenya', url: 'https://www.co-opbank.co.ke', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'Stanbic IBTC (Standard Bank Nigeria)', url: 'https://www.stanbicibtcbank.com', group: 'P3_AFRICAN_PEER_BANKS' },
  { name: 'JPMorgan Chase', url: 'https://www.jpmorganchase.com', group: 'P3_GSIB' },
  { name: 'Bank of America', url: 'https://www.bankofamerica.com', group: 'P3_GSIB' },
  { name: 'Citigroup', url: 'https://www.citigroup.com', group: 'P3_GSIB' },
  { name: 'HSBC', url: 'https://www.hsbc.com', group: 'P3_GSIB' },
  { name: 'Industrial and Commercial Bank of China (ICBC)', url: 'https://www.icbc-ltd.com', group: 'P3_GSIB' },
  { name: 'Agricultural Bank of China', url: 'https://www.abchina.com', group: 'P3_GSIB' },
  { name: 'Bank of China', url: 'https://www.boc.cn', group: 'P3_GSIB' },
  { name: 'Barclays', url: 'https://www.barclays.com', group: 'P3_GSIB' },
  { name: 'BNP Paribas', url: 'https://group.bnpparibas', group: 'P3_GSIB' },
  { name: 'China Construction Bank', url: 'https://www.ccb.com', group: 'P3_GSIB' },
  { name: 'Goldman Sachs', url: 'https://www.goldmansachs.com', group: 'P3_GSIB' },
  { name: 'Crédit Agricole', url: 'https://www.credit-agricole.com', group: 'P3_GSIB' },
  { name: 'Mitsubishi UFJ Financial Group (MUFG)', url: 'https://www.mufg.jp', group: 'P3_GSIB' },
  { name: 'UBS', url: 'https://www.ubs.com', group: 'P3_GSIB' },
  { name: 'Bank of Communications', url: 'https://www.bankcomm.com', group: 'P3_GSIB' },
  { name: 'Bank of New York Mellon', url: 'https://www.bnymellon.com', group: 'P3_GSIB' },
  { name: 'Deutsche Bank', url: 'https://www.db.com', group: 'P3_GSIB' },
  { name: 'Groupe BPCE', url: 'https://groupebpce.com', group: 'P3_GSIB' },
  { name: 'ING', url: 'https://www.ing.com', group: 'P3_GSIB' },
  { name: 'Mizuho Financial Group', url: 'https://www.mizuho-fg.com', group: 'P3_GSIB' },
  { name: 'Morgan Stanley', url: 'https://www.morganstanley.com', group: 'P3_GSIB' },
  { name: 'Royal Bank of Canada', url: 'https://www.rbc.com', group: 'P3_GSIB' },
  { name: 'Banco Santander', url: 'https://www.santander.com', group: 'P3_GSIB' },
  { name: 'Société Générale', url: 'https://www.societegenerale.com', group: 'P3_GSIB' },
  { name: 'Standard Chartered', url: 'https://www.sc.com', group: 'P3_GSIB' },
  { name: 'State Street', url: 'https://www.statestreet.com', group: 'P3_GSIB' },
  { name: 'Sumitomo Mitsui Financial Group', url: 'https://www.smfg.co.jp', group: 'P3_GSIB' },
  { name: 'Toronto-Dominion Bank (TD)', url: 'https://www.td.com', group: 'P3_GSIB' },
  { name: 'Wells Fargo', url: 'https://www.wellsfargo.com', group: 'P3_GSIB' },
];

// Helper to know if a domain is paywalled
export const PAYWALLED_DOMAINS = [
  'americanbanker.com',
  'thebanker.com',
  'centralbanking.com',
  'forbes.com',
];

// Islamic / Interest-free banking in Ethiopia
export const ISLAMIC_BANKS = ['Hijra Bank', 'ZamZam Bank', 'Shabelle Bank'];

// Discoverable extra sources to suggest
export const SUGGESTED_EXTRA_SOURCES = [
  { name: 'Ethiopian Securities Exchange (ESX)', url: 'https://esx.et', type: 'Exchange Notice' },
  { name: 'Nairobi Securities Exchange (NSE Kenya)', url: 'https://www.nse.co.ke', type: 'Exchange Notice' },
  { name: 'Johannesburg Stock Exchange (JSE SENS)', url: 'https://www.jse.co.za', type: 'Exchange Notice' },
  { name: 'Nigerian Exchange Group (NGX)', url: 'https://ngxgroup.com', type: 'Exchange Notice' },
  { name: 'Central Bank of Kenya (CBK)', url: 'https://www.centralbank.go.ke', type: 'Central Bank' },
  { name: 'South African Reserve Bank (SARB)', url: 'https://www.resbank.co.za', type: 'Central Bank' },
  { name: 'Central Bank of Nigeria (CBN)', url: 'https://www.cbn.gov.ng', type: 'Central Bank' },
  { name: 'Central Bank of Egypt (CBE Egypt)', url: 'https://www.cbe.org.eg', type: 'Central Bank' },
];
