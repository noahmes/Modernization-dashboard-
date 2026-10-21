import React, { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Star,
  Archive,
  CheckCircle2,
  FileText,
  Clock,
} from 'lucide-react';
import { StoredArticle } from '../server/db';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface NBEAlertStripProps {
  alerts: StoredArticle[];
  language?: SupportedLanguage;
  onAction: (id: string, action: 'star' | 'archive' | 'review') => void;
  onViewCachedCopy: (article: StoredArticle) => void;
}

export const NBEAlertStrip: React.FC<NBEAlertStripProps> = ({
  alerts,
  language = 'en',
  onAction,
  onViewCachedCopy,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(alerts.length > 0 ? alerts[0].id : null);
  const [isStripCollapsed, setIsStripCollapsed] = useState<boolean>(false);
  const t = TRANSLATIONS[language];

  // Filter specifically for NBE, ECMA, and capital market official notices/directives
  const nbeEcmaAlerts = alerts.filter(
    (a) =>
      a.source_name.includes('National Bank of Ethiopia') ||
      a.source_name.includes('ECMA') ||
      a.source_name.includes('StockMarket.et') ||
      a.title_original.toLowerCase().includes('nbe') ||
      a.title_original.toLowerCase().includes('directive') ||
      a.title_original.toLowerCase().includes('circular') ||
      a.title_original.toLowerCase().includes('ecma') ||
      a.title_original.toLowerCase().includes('capital market') ||
      a.tags?.includes('regulatory_directives')
  );

  if (nbeEcmaAlerts.length === 0) {
    return (
      <div className="bg-[#091326] border-y border-[#182a4d] px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">
            {t.priorityAlertsStrip}:
          </span>
          <span>{t.allDirectivesCurrent}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">30 min auto-poll</span>
      </div>
    );
  }

  return (
    <aside aria-label="Priority Regulatory Announcements" className="bg-[#101426] border-b-2 border-amber-500/80 shadow-lg text-slate-200 transition-all">
      {/* Header bar */}
      <div className="px-4 py-2 bg-[#151c36] border-b border-[#212d52] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-amber-400">
              {t.priorityAlertsStrip}
            </span>
            <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded-full border border-amber-500/30">
              {nbeEcmaAlerts.length} {t.activeNotices}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStripCollapsed(!isStripCollapsed)}
            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-[#1c2747] hover:bg-[#25345d] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>{isStripCollapsed ? 'Expand' : 'Minimize'}</span>
            {isStripCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Alert items */}
      {!isStripCollapsed && (
        <div className="divide-y divide-[#182747]">
          {nbeEcmaAlerts.map((item) => {
            const isExpanded = expandedId === item.id;
            const isNbe = item.source_name.includes('National Bank of Ethiopia') || item.title_original.includes('NBE');

            return (
              <div
                key={item.id}
                className={`p-3 transition-colors ${
                  item.status === 'starred'
                    ? 'bg-amber-950/20'
                    : isExpanded
                    ? 'bg-[#121a36]'
                    : 'bg-[#0c142b] hover:bg-[#111933]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          isNbe
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {isNbe ? 'NBE REGULATION' : 'ECMA CAPITAL MARKET'}
                      </span>

                      <span className="text-xs font-semibold text-slate-300">{item.source_name}</span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.published_at ? item.published_at.split('T')[0] : 'Today'}
                      </span>

                      {item.verification_status === 'verified' && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          {t.verifiedLink}
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-amber-300 bg-amber-900/30 px-1.5 py-0.2 rounded border border-amber-600/30 ml-auto">
                        {t.relevanceScore}: {item.relevance_score}/10
                      </span>
                    </div>

                    {/* Original Title */}
                    <h4 className="text-sm font-semibold text-white leading-snug hover:text-amber-300 transition-colors">
                      {item.title_original}
                    </h4>

                    {/* Summary snippet */}
                    {item.summary_ai && (
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                        {item.summary_ai}
                      </p>
                    )}

                    {/* Expanded details & Awash Implication */}
                    {isExpanded && item.awash_implication && (
                      <div className="mt-2.5 p-2.5 rounded bg-[#172242] border-l-4 border-amber-500 text-xs">
                        <span className="font-bold text-amber-400 block mb-0.5">
                          {t.soWhatForAwash}:
                        </span>
                        <p className="text-slate-200">{item.awash_implication}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions column */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-1">
                    <div className="flex items-center gap-1">
                      {/* View original link */}
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-300 hover:text-white bg-amber-600/20 hover:bg-amber-600 border border-amber-500/40 rounded transition-colors"
                      >
                        <span>{t.viewOriginal}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {/* Cached copy */}
                      <button
                        onClick={() => onViewCachedCopy(item)}
                        className="p-1 rounded text-slate-300 hover:text-white bg-[#19264a] hover:bg-[#223363] border border-[#2c3d70] text-xs transition-colors cursor-pointer"
                        title={t.cachedCopy}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* Star */}
                      <button
                        onClick={() => onAction(item.id, 'star')}
                        className={`p-1 rounded text-xs transition-colors cursor-pointer border ${
                          item.status === 'starred'
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'text-slate-400 hover:text-amber-400 bg-[#19264a] hover:bg-[#223363] border-[#2c3d70]'
                        }`}
                        title={t.star}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>

                      {/* Archive */}
                      <button
                        onClick={() => onAction(item.id, 'archive')}
                        className="p-1 rounded text-slate-400 hover:text-red-400 bg-[#19264a] hover:bg-[#223363] border border-[#2c3d70] text-xs transition-colors cursor-pointer"
                        title={t.archive}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 mt-1 cursor-pointer flex items-center gap-0.5"
                    >
                      <span>{isExpanded ? 'Less' : t.whyItMatters}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
