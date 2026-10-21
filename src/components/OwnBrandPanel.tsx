import React from 'react';
import { Building2, ExternalLink, FileText, CheckCircle2, Clock } from 'lucide-react';
import { StoredArticle } from '../server/db';

interface OwnBrandPanelProps {
  items: StoredArticle[];
  onViewCachedCopy: (article: StoredArticle) => void;
}

export const OwnBrandPanel: React.FC<OwnBrandPanelProps> = ({ items, onViewCachedCopy }) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-xl bg-[#0c152e] border border-[#1d2f5a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Awash Bank Internal & Corporate News Wire</h3>
            <p className="text-xs text-slate-400">
              Own-brand portal surveillance. Separated from competitor intelligence analysis.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-orange-400 bg-orange-950/40 border border-orange-500/30 px-2.5 py-1 rounded-md">
          {items.length} Official Publications
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#0a1226] border border-[#182747]">
          <Building2 className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-semibold text-slate-300">No active Awash Bank announcements stored yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            The automated scheduler polls https://awashbank.com/news every 60 minutes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#0e1730] border border-[#1b2b52] hover:border-orange-500/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/30">
                    Awash Bank Official
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {item.published_at.split('T')[0]}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug hover:text-orange-400 transition-colors mb-2">
                  {item.title_original}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-3">
                  {item.summary_ai || item.raw_text}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#182747] text-xs">
                {item.verification_status === 'verified' && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Link Verified
                  </span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => onViewCachedCopy(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#152345] hover:bg-[#1e3263] text-slate-200 transition-colors cursor-pointer border border-[#24396b]"
                  >
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Cached Copy</span>
                  </button>

                  <a
                    href={item.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-medium transition-colors cursor-pointer"
                  >
                    <span>View Original</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
