import React, { useState } from 'react';
import { Search, Filter, RotateCcw, Star, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { StoredArticle, StoredSource } from '../server/db';
import { ArticleCard } from './ArticleCard';
import { THEMES, LEGACY_THEME_MAP } from '../themes';

interface ArchiveFilterViewProps {
  articles: StoredArticle[];
  sources: StoredSource[];
  onAction: (id: string, action: 'star' | 'archive' | 'review') => void;
  onViewCachedCopy: (article: StoredArticle) => void;
}

export const ArchiveFilterView: React.FC<ArchiveFilterViewProps> = ({
  articles,
  sources,
  onAction,
  onViewCachedCopy,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedSourceId, setSelectedSourceId] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [minScore, setMinScore] = useState<number>(0);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'this_week' | 'last_14_days'>('all');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Derive unique tags
  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags)));

  const filtered = articles.filter((a) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        a.title_original.toLowerCase().includes(q) ||
        (a.summary_ai && a.summary_ai.toLowerCase().includes(q)) ||
        a.raw_text.toLowerCase().includes(q) ||
        a.source_name.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Group
    if (selectedGroup !== 'ALL' && a.source_group !== selectedGroup) return false;

    // Source
    if (selectedSourceId !== 'ALL' && a.source_id !== selectedSourceId) return false;

    // Tag / Theme
    if (selectedTag !== 'ALL') {
      const legacyTag = Object.entries(LEGACY_THEME_MAP).find(([_, v]) => v === selectedTag)?.[0];
      const hasMatch = a.tags.includes(selectedTag) || (legacyTag && a.tags.includes(legacyTag));
      if (!hasMatch) return false;
    }

    // Score
    if (a.relevance_score < minScore) return false;

    // Starred
    if (onlyStarred && a.status !== 'starred') return false;

    // Verified
    if (onlyVerified && a.verification_status !== 'verified') return false;

    // Date range
    if (dateRange !== 'all') {
      const pubTime = new Date(a.published_at).getTime();
      const now = Date.now();
      if (dateRange === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!a.published_at.startsWith(todayStr)) return false;
      } else if (dateRange === 'this_week') {
        if (pubTime < now - 7 * 24 * 60 * 60 * 1000) return false;
      } else if (dateRange === 'last_14_days') {
        if (pubTime < now - 14 * 24 * 60 * 60 * 1000) return false;
      }
    }

    return true;
  });

  const handleReset = () => {
    setSearch('');
    setSelectedGroup('ALL');
    setSelectedSourceId('ALL');
    setSelectedTag('ALL');
    setMinScore(0);
    setDateRange('all');
    setOnlyStarred(false);
    setOnlyVerified(false);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Box */}
      <div className="p-5 rounded-xl bg-[#0b1328] border border-[#1b2b52] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Full-text archive search across headline, stored raw body, source, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#060b18] border border-[#1a2c54] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-orange-500 font-medium"
            />
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#142142] hover:bg-[#1d305e] text-slate-300 text-xs font-semibold border border-[#213566] transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Group */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Source Priority Group:</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#060b18] border border-[#1b2b52] rounded-lg text-white font-mono text-xs"
            >
              <option value="ALL">All Source Groups</option>
              <option value="P1_ETHIOPIA_MEDIA_REG">P1 Ethiopia Media & Reg</option>
              <option value="P1_ETHIOPIAN_BANKS">P1 Ethiopian Banks</option>
              <option value="OWN_BRAND">Own Brand (Awash)</option>
              <option value="P2_FINTECH_MEDIA">P2 Global Fintech Media</option>
              <option value="P2_AFRICA_MEDIA">P2 Africa Media</option>
              <option value="P3_AFRICAN_PEER_BANKS">P3 African Peer Banks</option>
              <option value="P3_GSIB">P3 Global Systemic Banks</option>
            </select>
          </div>

          {/* Specific Source */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Specific Source:</label>
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#060b18] border border-[#1b2b52] rounded-lg text-white font-mono text-xs truncate"
            >
              <option value="ALL">All Sources ({sources.length})</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Tag */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Theme (22 Sub-Sectors):</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#060b18] border border-[#1b2b52] rounded-lg text-white font-mono text-xs"
            >
              <option value="ALL">All Themes (22 Sub-sectors)</option>
              {['Payments & Channels', 'Technology & Data', 'Customer & Identity', 'Cross-border, FX & Regulation', 'Growth & Balance Sheet'].map((cluster) => (
                <optgroup key={cluster} label={cluster}>
                  {THEMES.filter((th) => th.cluster === cluster).map((th) => (
                    <option key={th.id} value={th.id}>
                      {th.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Time Horizon:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[#060b18] border border-[#1b2b52] rounded-lg text-white font-mono text-xs"
            >
              <option value="all">All Stored History</option>
              <option value="today">Today</option>
              <option value="this_week">Past 7 Days</option>
              <option value="last_14_days">Past 14 Days</option>
            </select>
          </div>
        </div>

        {/* Toggles bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#162345] text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Min Score slider */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">Min Score:</span>
              <input
                type="range"
                min="0"
                max="10"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-24 accent-orange-500 cursor-pointer"
              />
              <span className="font-mono text-orange-400 font-bold">{minScore}+</span>
            </div>

            {/* Only Starred */}
            <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyStarred}
                onChange={(e) => setOnlyStarred(e.target.checked)}
                className="rounded accent-orange-500"
              />
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Starred Only</span>
            </label>

            {/* Only Verified */}
            <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="rounded accent-orange-500"
              />
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Links Only</span>
            </label>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Matching Announcements: <strong className="text-orange-400 font-bold">{filtered.length}</strong>
          </span>
        </div>
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center rounded-xl bg-[#0b1328] border border-[#1b2b52]">
          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">No announcements match the selected criteria</h4>
          <p className="text-xs text-slate-400">
            Try adjusting your keyword query, lowering the minimum score, or resetting the group filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <ArticleCard
              key={item.id}
              article={item}
              onAction={onAction}
              onViewCachedCopy={onViewCachedCopy}
              onFilterByTag={(tag) => setSelectedTag(tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
