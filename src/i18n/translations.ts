export type SupportedLanguage = 'en' | 'am' | 'om';

export interface Translations {
  appName: string;
  appSubtitle: string;
  activeRadar: string;
  ethiopiaLane: string;
  ownBrandNews: string;
  matrixHeatmap: string;
  archiveDeepSearch: string;
  sourceHealthRegistry: string;
  briefingExport: string;
  priorityAlertsStrip: string;
  activeNotices: string;
  allDirectivesCurrent: string;
  viewOriginal: string;
  cachedCopy: string;
  whyItMatters: string;
  strategicTakeaway: string;
  soWhatForAwash: string;
  relevanceScore: string;
  verifiedLink: string;
  unverifiedLink: string;
  paywalled: string;
  star: string;
  starred: string;
  archive: string;
  syncNow: string;
  syncing: string;
  lastSync: string;
  todayCount: string;
  sourcesHealthy: string;
  filterByGroup: string;
  filterByTag: string;
  filterByCategory: string;
  allCategories: string;
  allGroups: string;
  allThemes: string;
  searchPlaceholder: string;
  noArticlesFound: string;
  cachedModalTitle: string;
  cachedModalDesc: string;
  copyRawText: string;
  close: string;
  categories: {
    productLaunch: string;
    partnership: string;
    techAcquisition: string;
    processAutomation: string;
    transformation: string;
    funding: string;
  };
  geographies: {
    ethiopia: string;
    africa: string;
    global: string;
    crossBorder: string;
  };
  impactLevels: {
    high: string;
    medium: string;
    watchlist: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'Awash Bank Modernization Pulse',
    appSubtitle: 'Live Banking, Fintech & Regulatory Intelligence Surveillance for Change & Treasury Strategy',
    activeRadar: 'Active Radar Stream',
    ethiopiaLane: 'Ethiopia Priority Lane',
    ownBrandNews: 'Awash Bank News',
    matrixHeatmap: 'Category Matrix',
    archiveDeepSearch: 'Archive & Deep Search',
    sourceHealthRegistry: 'Source Health',
    briefingExport: 'Executive Briefing',
    priorityAlertsStrip: 'Priority Regulatory Lane · NBE Directives & ECMA Notices',
    activeNotices: 'Active Notices',
    allDirectivesCurrent: 'National Bank of Ethiopia (NBE) & ECMA radar active. All official directives current.',
    viewOriginal: 'View Original',
    cachedCopy: 'Cached Copy',
    whyItMatters: 'Why it matters to Awash Bank',
    strategicTakeaway: 'Strategic Takeaway',
    soWhatForAwash: 'So What for Awash Bank',
    relevanceScore: 'Relevance Score',
    verifiedLink: 'Verified Link',
    unverifiedLink: 'Unverified Link',
    paywalled: 'Paywalled Snippet',
    star: 'Star',
    starred: 'Starred',
    archive: 'Archive',
    syncNow: 'Sync Now',
    syncing: 'Syncing Feeds...',
    lastSync: 'Last Sync',
    todayCount: 'Today',
    sourcesHealthy: 'Sources OK',
    filterByGroup: 'Filter Group',
    filterByTag: 'Theme Tag',
    filterByCategory: 'Modernization Category',
    allCategories: 'All Categories',
    allGroups: 'All Groups',
    allThemes: 'All Themes',
    searchPlaceholder: 'Search verified announcements by title, body, source or tag...',
    noArticlesFound: 'No verified announcements match the selected criteria',
    cachedModalTitle: 'Stored Raw Article Snapshot (Ground Truth)',
    cachedModalDesc: 'Unaltered raw text ingested directly from the publisher. Summaries are strictly bounded to this snapshot.',
    copyRawText: 'Copy Raw Text',
    close: 'Close',
    categories: {
      productLaunch: 'Product/Service Launch',
      partnership: 'Partnership',
      techAcquisition: 'Technology Acquisition / Platform Deal',
      processAutomation: 'Business Process Modernization / Automation',
      transformation: 'Transformation Initiative / Strategy Announcement',
      funding: 'Funding / Valuation Signal',
    },
    geographies: {
      ethiopia: 'Ethiopia',
      africa: 'Africa',
      global: 'Global',
      crossBorder: 'Cross-border',
    },
    impactLevels: {
      high: 'High (large bank or systemic)',
      medium: 'Medium',
      watchlist: 'Watchlist',
    },
  },
  am: {
    appName: 'አዋሽ ባንክ የዘመናዊነት መከታተያ (Modernization Pulse)',
    appSubtitle: 'የባንክ ዘመናዊ አሠራር፣ የፋይናንስ ቴክኖሎጂ እና የብሔራዊ ባንክ መመሪያዎች የቀጥታ መረጃ መከታተያ',
    activeRadar: 'የቀጥታ መረጃ ዥረት',
    ethiopiaLane: 'የኢትዮጵያ ቅድሚያ መስመር',
    ownBrandNews: 'የአዋሽ ባንክ ዜናዎች',
    matrixHeatmap: 'የምድብ ማትሪክስ (Heatmap)',
    archiveDeepSearch: 'የተሟላ ማህደር እና ፍለጋ',
    sourceHealthRegistry: 'የመረጃ ምንጮች ጤንነት',
    briefingExport: 'የአስፈፃሚዎች ሪፖርት',
    priorityAlertsStrip: 'አስቸኳይ የቁጥጥር መስመር · የኢትዮጵያ ብሔራዊ ባንክ እና የካፒታል ገበያ ባለስልጣን መመሪያዎች',
    activeNotices: 'ንቁ መመሪያዎች',
    allDirectivesCurrent: 'የኢትዮጵያ ብሔራዊ ባንክ እና የካፒታል ገበያ መመሪያዎች ክትትል እየተደረገባቸው ነው። ሁሉም የቅርብ ጊዜ መመሪያዎች ተካተዋል።',
    viewOriginal: 'ዋናውን ምንጭ ይመልከቱ',
    cachedCopy: 'የተቀመጠ ቅጂ',
    whyItMatters: 'ለአዋሽ ባንክ ያለው ስትራቴጂካዊ ፋይዳ',
    strategicTakeaway: 'ዋና ቁልፍ ነጥብ',
    soWhatForAwash: 'ለአዋሽ ባንክ ቀጣይ እርምጃ',
    relevanceScore: 'የተዛማጅነት ነጥብ',
    verifiedLink: 'የተረጋገጠ ማስፈንጠሪያ',
    unverifiedLink: 'ያልተረጋገጠ ማስፈንጠሪያ',
    paywalled: 'ክፍያ የሚጠይቅ ምንጭ',
    star: 'አስቀምጥ (ኮከብ)',
    starred: 'የተመረጠ',
    archive: 'ወደ ማህደር ላክ',
    syncNow: 'አሁን አድስ',
    syncing: 'በማደስ ላይ...',
    lastSync: 'የመጨረሻ ዕድሳት',
    todayCount: 'የዛሬ ዜናዎች',
    sourcesHealthy: 'ንቁ ምንጮች',
    filterByGroup: 'በቡድን ይምረጡ',
    filterByTag: 'የትኩረት አርዕስት',
    filterByCategory: 'የዘመናዊነት ዘርፍ',
    allCategories: 'ሁሉም ዘርፎች',
    allGroups: 'ሁሉም ቡድኖች',
    allThemes: 'ሁሉም አርዕስቶች',
    searchPlaceholder: 'የተረጋገጡ ዜናዎችን በርዕስ፣ በይዘት ወይም በምንጭ ይፈልጉ...',
    noArticlesFound: 'በተመረጠው መስፈርት የተገኘ ዜና የለም',
    cachedModalTitle: 'በዳታቤዝ ውስጥ የተቀመጠ ያልተለወጠ ሙሉ ይዘት (Ground Truth)',
    cachedModalDesc: 'ከመጀመሪያው ምንጭ በቀጥታ የተቀዳ ያልተበረዘ ጽሑፍ። የትንተና ውጤቶች በዚህ ላይ ብቻ የተመሰረቱ ናቸው።',
    copyRawText: 'ሙሉ ጽሑፉን ቅዳ',
    close: 'ዝጋ',
    categories: {
      productLaunch: 'አዲስ ምርት / አገልግሎት ይፋ ማድረግ',
      partnership: 'ስትራቴጂካዊ አጋርነት',
      techAcquisition: 'የቴክኖሎጂ ግዢ / የፕላትፎርም ስምምነት',
      processAutomation: 'የሥራ ሂደት ዘመናዊነት / አውቶሜሽን',
      transformation: 'የትራንስፎርሜሽን እቅድ / የስትራቴጂ ማስታወቂያ',
      funding: 'የካፒታልና ኢንቨስትመንት ምልክት',
    },
    geographies: {
      ethiopia: 'ኢትዮጵያ',
      africa: 'አፍሪካ',
      global: 'ዓለም አቀፍ',
      crossBorder: 'ድንበር-ተሻጋሪ',
    },
    impactLevels: {
      high: 'ከፍተኛ ተፅዕኖ (ሲስተሚክ)',
      medium: 'መካከለኛ',
      watchlist: 'ክትትል የሚደረግበት',
    },
  },
  om: {
    appName: 'Baankii Hawaash - Modernization Pulse',
    appSubtitle: 'Odeeffannoo Haaraa Ammayyeessaa Baankii, Faayinaansii fi Qajeelfamoota Mootummaa',
    activeRadar: 'Odeeffannoo Battalaa (Radar)',
    ethiopiaLane: 'Tarkaanfii Dursa Itoophiyaa',
    ownBrandNews: 'Oduu Baankii Hawaash',
    matrixHeatmap: 'Gabatee Ramaddii (Matrix)',
    archiveDeepSearch: 'Kuusaa & Barbaacha Bal’aa',
    sourceHealthRegistry: 'Fayyaa Maddootaa',
    briefingExport: 'Gabaasa Hoggansaa',
    priorityAlertsStrip: 'Sarara Qajeelfama Dursaa · Qajeelfamoota NBE fi ECMA',
    activeNotices: 'Qajeelfamoota Hojirra Jiran',
    allDirectivesCurrent: 'Hordoffiin qajeelfama Baankii Biyyooleessaa fi ECMA dammaqinaan hojjechaa jira.',
    viewOriginal: 'Madda Jalqabaa Bani',
    cachedCopy: 'Garagalcha Kuufame',
    whyItMatters: 'Faayidaa Baankii Hawaashiif Qabu',
    strategicTakeaway: 'Qabxii Murteessaa',
    soWhatForAwash: 'Tarkaanfii Baankii Hawaash',
    relevanceScore: 'Qabxii Walitti-dhufeenyaa',
    verifiedLink: 'Geessituu Mirkanaa’e',
    unverifiedLink: 'Geessituu Hin Mirkanoofne',
    paywalled: 'Madda Kaffaltii Barbaadu',
    star: 'Urjii (Filadhu)',
    starred: 'Filatameera',
    archive: 'Kuusatti Galchi',
    syncNow: 'Amma Haaromsi',
    syncing: 'Haaromsamaa jira...',
    lastSync: 'Haaromsa Dhumaa',
    todayCount: 'Har’a',
    sourcesHealthy: 'Maddoota Nagaa',
    filterByGroup: 'Gareedhaan Calali',
    filterByTag: 'Mata-duree',
    filterByCategory: 'Gosa Ammayyeessaa',
    allCategories: 'Gosoota Hunda',
    allGroups: 'Garee Hunda',
    allThemes: 'Mata-duree Hunda',
    searchPlaceholder: 'Oduu mirkanaa’e mata-dureen ykn qabiyyee barbaadi...',
    noArticlesFound: 'Oduun ulaagaa calallii kanaan walsimu hin argamne',
    cachedModalTitle: 'Barruu Jalqabaa Kuufame (Ground Truth)',
    cachedModalDesc: 'Barruu maddarraa osoo hin jijjiiramin toora kuusaatti fudhatame. Ibsi fi xiinxalli kanarratti qofa hundaa’a.',
    copyRawText: 'Barruu Koppii Godhi',
    close: 'Cufi',
    categories: {
      productLaunch: 'Tajaajila / Oomisha Haaraa',
      partnership: 'Tumsa / Hirmaannaa Hojii',
      techAcquisition: 'Bitta Teeknooloojii / Waliigaltee',
      processAutomation: 'Adeemsa Hojii Ammayyeessuu / Awtomeeshinii',
      transformation: 'Tarsiimoo Jijjiiramaa',
      funding: 'Mallattoo Kaappitaalaa fi Invastimantii',
    },
    geographies: {
      ethiopia: 'Itoophiyaa',
      africa: 'Afrikaa',
      global: 'Addunyaa',
      crossBorder: 'Daangaa-ce’aa',
    },
    impactLevels: {
      high: 'Dhiibbaa Guddaa (Systemic)',
      medium: 'Giddu-galeessa',
      watchlist: 'Hordoffii Barbaadu',
    },
  },
};
