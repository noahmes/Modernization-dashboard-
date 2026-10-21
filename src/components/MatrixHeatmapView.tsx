import React, { useState } from 'react';
import { Layers, CheckCircle2, ChevronRight, BarChart3, Filter } from 'lucide-react';
import { StoredArticle } from '../server/db';
import { ArticleCard } from './ArticleCard';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';

interface MatrixHeatmapViewProps {
  articles: StoredArticle[];
  language: SupportedLanguage;
  onAction: (id: string, action: 'star' | 'archive' | 'review') => void;
  onViewCachedCopy: (article: StoredArticle) => void;
}

const GEOGRAPHIES: Array<'Ethiopia' | 'Africa' | 'Global' | 'Cross-border'> = [
  'Ethiopia',
  'Africa',
  'Cross-border',
  'Global',
];

const CATEGORIES: Array<StoredArticle['category']> = [
  'Transformation Initiative / Strategy Announcement',
  'Business Process Modernization / Automation',
  'Product/Service Launch',
  'Partnership',
  'Technology Acquisition / Platform Deal',
  'Funding / Valuation Signal',
];

export const MatrixHeatmapView: React.FC<MatrixHeatmapViewProps> = ({
  articles,
  language,
  onAction,
  onViewCachedCopy,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedCell, setSelectedCell] = useState<{
    geography: string;
    category: string;
  } | null>(null);

  // Calculate cell counts
  const matrixCounts: Record<string, number> = {};
  for (const art of articles) {
    const geo = art.geography || 'Global';
    const cat = art.category || 'Transformation Initiative / Strategy Announcement';
    const key = `${geo}__${cat}`;
    matrixCounts[key] = (matrixCounts[key] || 0) + 1;
  }

  // Articles for selected cell
  const cellArticles = selectedCell
    ? articles.filter((a) => {
        const geo = a.geography || 'Global';
        const cat = a.category || 'Transformation Initiative / Strategy Announcement';
        return geo === selectedCell.geography && cat === selectedCell.category;
      })
    : [];

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-[#080f22] text-slate-500 hover:bg-[#0c1630] border-[#152347]';
    if (count === 1) return 'bg-[#0f244a] text-blue-300 hover:bg-[#163366] border-[#1e3f7a]';
    if (count <= 3) return 'bg-[#1b356b] text-orange-300 hover:bg-[#25468a] border-[#29529e]';
    return 'bg-[#7c2d12] text-orange-200 hover:bg-[#9a3412] border-orange-500 font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-[#0b1328] border border-[#1b2b52] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t.matrixHeatmap}</h3>
            <p className="text-xs text-slate-400">
              Cross-tabulation of verified intelligence by Geography and Modernization Taxonomy Category.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-300 bg-[#121e3d] px-3 py-1.5 rounded-lg border border-[#1e305e]">
          Total Mapped: <strong className="text-orange-400 font-bold">{articles.length}</strong>
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-[#091024] p-4 rounded-xl border border-[#182647] overflow-x-auto shadow-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-[11px] font-mono uppercase text-slate-400 border-b border-[#1b2b52] min-w-44">
                {t.filterByCategory}
              </th>
              {GEOGRAPHIES.map((geo) => (
                <th
                  key={geo}
                  className="p-3 text-center text-xs font-bold text-slate-200 border-b border-[#1b2b52] min-w-28"
                >
                  <span className="font-mono">
                    {geo === 'Ethiopia'
                      ? t.geographies.ethiopia
                      : geo === 'Africa'
                      ? t.geographies.africa
                      : geo === 'Cross-border'
                      ? t.geographies.crossBorder
                      : t.geographies.global}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152345]">
            {CATEGORIES.map((cat) => (
              <tr key={cat}>
                <td className="p-3 font-semibold text-slate-200 text-xs">
                  {cat === 'Product/Service Launch'
                    ? t.categories.productLaunch
                    : cat === 'Partnership'
                    ? t.categories.partnership
                    : cat === 'Technology Acquisition / Platform Deal'
                    ? t.categories.techAcquisition
                    : cat === 'Business Process Modernization / Automation'
                    ? t.categories.processAutomation
                    : cat === 'Transformation Initiative / Strategy Announcement'
                    ? t.categories.transformation
                    : t.categories.funding}
                </td>
                {GEOGRAPHIES.map((geo) => {
                  const key = `${geo}__${cat}`;
                  const count = matrixCounts[key] || 0;
                  const isSelected = selectedCell?.geography === geo && selectedCell?.category === cat;

                  return (
                    <td key={geo} className="p-2 text-center">
                      <button
                        onClick={() => setSelectedCell({ geography: geo, category: cat })}
                        className={`w-full py-2.5 px-3 rounded-lg border transition-all cursor-pointer font-mono text-xs flex items-center justify-center gap-1.5 ${getHeatmapColor(
                          count
                        )} ${isSelected ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-[#091024]' : ''}`}
                      >
                        <span>{count}</span>
                        {count > 0 && <ChevronRight className="w-3 h-3 opacity-60" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Drill-down */}
      {selectedCell && (
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-[#0c152e] border border-orange-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-white">
                Filtered Cell: <strong className="text-orange-400">{selectedCell.geography}</strong> ×{' '}
                <strong className="text-orange-400">{selectedCell.category}</strong>
              </span>
              <span className="text-xs font-mono text-slate-400">({cellArticles.length} items)</span>
            </div>

            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-[#162447] transition-colors cursor-pointer"
            >
              Clear Filter
            </button>
          </div>

          {cellArticles.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#0b1328] border border-[#1b2b52]">
              <p className="text-xs text-slate-400">No verified items in this specific matrix cell currently.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cellArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  language={language}
                  onAction={onAction}
                  onViewCachedCopy={onViewCachedCopy}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
