import React, { useState } from 'react';
import { Flag, Building2, Search, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { StoredArticle } from '../server/db';
import { ArticleCard } from './ArticleCard';

interface EthiopiaPriorityLaneProps {
  articles: StoredArticle[];
  onAction: (id: string, action: 'star' | 'archive' | 'review') => void;
  onViewCachedCopy: (article: StoredArticle) => void;
}

export const EthiopiaPriorityLane: React.FC<EthiopiaPriorityLaneProps> = ({
  articles,
  onAction,
  onViewCachedCopy,
}) => {
  const [bankFilter, setBankFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Ethiopia items: P1_ETHIOPIA_MEDIA_REG, P1_ETHIOPIAN_BANKS, or mentions Ethiopia
  const ethiopiaArticles = articles.filter((a) => {
    const isEth =
      a.source_group === 'P1_ETHIOPIA_MEDIA_REG' ||
      a.source_group === 'P1_ETHIOPIAN_BANKS' ||
      a.source_group === 'OWN_BRAND' ||
      a.title_original.toLowerCase().includes('ethiopia') ||
      a.title_original.toLowerCase().includes('birr') ||
      a.title_original.toLowerCase().includes('nbe') ||
      a.title_original.toLowerCase().includes('cbe') ||
      a.title_original.toLowerCase().includes('dashen') ||
      a.title_original.toLowerCase().includes('wegagen');
    if (!isEth) return false;

    if (bankFilter !== 'ALL' && !a.source_name.toLowerCase().includes(bankFilter.toLowerCase())) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      if (!a.title_original.toLowerCase().includes(q) && !(a.summary_ai && a.summary_ai.toLowerCase().includes(q))) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#0d1c3a] via-[#0e2448] to-[#0c1833] border border-[#1e3a6e] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">Ethiopia Priority Intelligence Lane</h2>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                P1 HIGH-SIGNAL
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Dedicated surveillance over NBE directives, Birr FX float reforms, EthSwitch rails, and 27 licensed Ethiopian commercial banks.
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-slate-300 bg-[#091329] px-3 py-1.5 rounded-lg border border-[#1c305c] self-start sm:self-auto">
          <span className="text-slate-400">Total Tracked: </span>
          <strong className="text-emerald-400 text-sm">{ethiopiaArticles.length}</strong>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d162f] p-3 rounded-xl border border-[#1b2b52]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Ethiopia announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#080f22] border border-[#1a2b52] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs">
          <span className="text-slate-400 font-medium shrink-0">Filter Entity:</span>
          {['ALL', 'NBE', 'Commercial Bank of Ethiopia', 'Dashen', 'Wegagen', 'Abyssinia', 'EthSwitch', 'Awash'].map(
            (bank) => (
              <button
                key={bank}
                onClick={() => setBankFilter(bank)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono shrink-0 transition-colors cursor-pointer ${
                  bankFilter === bank
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-[#132247] text-slate-300 hover:text-white'
                }`}
              >
                {bank}
              </button>
            )
          )}
        </div>
      </div>

      {/* Articles Grid */}
      {ethiopiaArticles.length === 0 ? (
        <div className="p-16 text-center rounded-xl bg-[#0b1328] border border-[#1b2b52]">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">No Ethiopian announcements stored yet</h4>
          <p className="text-xs text-slate-400">
            Click "Sync Now" in the top bar to poll Capital Ethiopia, NBE, The Reporter, Addis Fortune, and Ethiopian commercial bank feeds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ethiopiaArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onAction={onAction}
              onViewCachedCopy={onViewCachedCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
};
