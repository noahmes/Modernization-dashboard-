import React from 'react';
import {
  Activity,
  RefreshCw,
  Building2,
  Archive,
  BarChart3,
  FileText,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe2,
  Sparkles,
} from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface SystemTelemetry {
  lastSyncTime: string | null;
  lastSyncStatus: string;
  lastSyncError: string | null;
  totalArticles: number;
  newToday: number;
  totalSources: number;
  healthySources: number;
  errorSources: number;
  llmCallsToday: number;
  dailyLlmCap: number;
}

interface TopNavProps {
  telemetry: SystemTelemetry | null;
  activeTab: 'stream' | 'ethiopia' | 'own_brand' | 'matrix' | 'archive' | 'sources' | 'briefing';
  language: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onSelectTab: (tab: 'stream' | 'ethiopia' | 'own_brand' | 'matrix' | 'archive' | 'sources' | 'briefing') => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  telemetry,
  activeTab,
  language,
  onSelectLanguage,
  onSelectTab,
  onSyncNow,
  isSyncing,
}) => {
  const t = TRANSLATIONS[language];

  const formatTimeAgo = (isoTime: string | null) => {
    if (!isoTime) return 'Never';
    const diff = Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <header className="bg-[#050b1a] border-b border-[#162547] sticky top-0 z-40 shadow-2xl backdrop-blur-md">
      {/* Visual Accent Header Strip (Awash Gold & Navy corporate signature) */}
      <div className="h-1.5 bg-gradient-to-r from-[#003399] via-[#f58220] to-[#ff9800]" />

      {/* Main Top Header Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity & Official Awash Bank Logo + Heading Graphics */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Authentic Awash Bank Official Logo Container */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#f58220]/50 via-[#003399]/40 to-[#f58220]/50 blur-sm opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white rounded-xl px-2.5 py-1.5 shadow-lg border border-[#f58220]/60 flex items-center justify-center">
              <img
                src="/assets/aistudio/image_ef6a5782.png"
                alt="Awash Bank - አዋሽ ባንክ"
                className="h-9 sm:h-11 w-auto object-contain"
              />
            </div>
          </div>

          {/* Heading Graphics Asset & Corporate Badge */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/image_cfbd469d.png"
                alt="Awash Bank Modernization Pulse - Tracking updates on banking industries"
                className="h-8 sm:h-10 w-auto object-contain mix-blend-screen"
              />
              <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-[#f58220]/15 text-[#f58220] border border-[#f58220]/40 px-2.5 py-0.5 rounded-full shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#f58220] animate-pulse" />
                AWASH BANK
              </span>
            </div>
            <span className="sr-only">Awash Bank Modernization Pulse - Tracking updates on banking industries</span>
          </div>
        </div>

        {/* Right side: Trilingual Language Switcher + Telemetry + Sync */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Trilingual Selector: English | Amharic | Afan Oromo */}
          <div className="flex items-center bg-[#091228] border border-[#1b2b52] rounded-lg p-0.5 text-xs font-semibold shadow-inner">
            <div className="px-2 py-1 text-slate-400 flex items-center gap-1 border-r border-[#1b2b52]">
              <Globe2 className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <button
              onClick={() => onSelectLanguage('en')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer text-xs font-mono ${
                language === 'en'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#121f3d]'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => onSelectLanguage('am')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer text-xs ${
                language === 'am'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#121f3d]'
              }`}
              title="አማርኛ (Amharic)"
            >
              አማ
            </button>
            <button
              onClick={() => onSelectLanguage('om')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer text-xs font-mono ${
                language === 'om'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#121f3d]'
              }`}
              title="Afaan Oromoo"
            >
              OM
            </button>
          </div>

          {/* Telemetry pill */}
          {telemetry && (
            <div className="hidden xl:flex items-center gap-3 text-xs font-mono bg-[#091228] border border-[#1b2b52] px-3.5 py-1.5 rounded-lg text-slate-300 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.lastSync}: <strong className="text-white">{formatTimeAgo(telemetry.lastSyncTime)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-[#1b2b52] pl-3">
                <Radio className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                <span>{t.todayCount}: <strong className="text-orange-400 font-bold">{telemetry.newToday}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-[#1b2b52] pl-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {t.sourcesHealthy}: <strong className="text-emerald-400">{telemetry.healthySources}</strong>/{telemetry.totalSources}
                </span>
              </div>
            </div>
          )}

          {/* Sync Now button with Awash corporate gradient */}
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#f58220] to-[#e65100] hover:from-[#ff9800] hover:to-[#f58220] text-white text-xs font-bold transition-all shadow-md hover:shadow-orange-500/20 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t.syncing : t.syncNow}</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs bar with Matrix View included */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-[#121e3b] text-xs">
        <button
          onClick={() => onSelectTab('stream')}
          className={`px-4 py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'stream'
              ? 'border-orange-500 text-white bg-[#0e1730] shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0c142b]'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-orange-400" />
          <span>{t.activeRadar}</span>
        </button>

        <button
          onClick={() => onSelectTab('ethiopia')}
          className={`px-4 py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'ethiopia'
              ? 'border-orange-500 text-white bg-[#0e1730] shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0c142b]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{t.ethiopiaLane}</span>
        </button>

        <button
          onClick={() => onSelectTab('own_brand')}
          className={`px-4 py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'own_brand'
              ? 'border-orange-500 text-white bg-[#0e1730] shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0c142b]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.ownBrandNews}</span>
        </button>

        {/* Matrix Heatmap Tab */}
        <button
          onClick={() => onSelectTab('matrix')}
          className={`px-4 py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'matrix'
              ? 'border-orange-500 text-white bg-[#0e1730] shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0c142b]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.matrixHeatmap}</span>
        </button>

        <button
          onClick={() => onSelectTab('archive')}
          className={`px-4 py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'archive'
              ? 'border-orange-500 text-white bg-[#0e1730] shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0c142b]'
          }`}
        >
          <Archive className="w-3.5 h-3.5 text-blue-400" />
          <span>{t.archiveDeepSearch}</span>
        </button>

        <button
          onClick={() => onSelectTab('sources')}
          className={`px-4 py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'sources'
              ? 'border-orange-500 text-white bg-[#0e1730] shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0c142b]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.sourceHealthRegistry}</span>
        </button>

        <button
          onClick={() => onSelectTab('briefing')}
          className={`px-4 py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'briefing'
              ? 'border-orange-500 text-white bg-[#0e1730] shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0c142b]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.briefingExport}</span>
        </button>
      </div>
    </header>
  );
};
