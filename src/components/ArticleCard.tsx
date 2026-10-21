import React, { useState } from 'react';
import {
  ExternalLink,
  FileText,
  Star,
  Archive,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Layers,
  Lock,
  Tag,
  Globe,
} from 'lucide-react';
import { StoredArticle } from '../server/db';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations';
import { THEME_BY_ID, ThemeId } from '../themes';

interface ArticleCardProps {
  article: StoredArticle;
  language?: SupportedLanguage;
  onAction: (id: string, action: 'star' | 'archive' | 'review') => void;
  onViewCachedCopy: (article: StoredArticle) => void;
  onFilterByTag?: (tag: string) => void;
  onFilterByCategory?: (cat: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  language = 'en',
  onAction,
  onViewCachedCopy,
  onFilterByTag,
  onFilterByCategory,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const t = TRANSLATIONS[language];

  const isStarred = article.status === 'starred';
  const isHighPriority = article.relevance_score >= 7;

  // Translation helpers
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Product/Service Launch':
        return t.categories.productLaunch;
      case 'Partnership':
        return t.categories.partnership;
      case 'Technology Acquisition / Platform Deal':
        return t.categories.techAcquisition;
      case 'Business Process Modernization / Automation':
        return t.categories.processAutomation;
      case 'Transformation Initiative / Strategy Announcement':
        return t.categories.transformation;
      case 'Funding / Valuation Signal':
        return t.categories.funding;
      default:
        return cat;
    }
  };

  const getGeographyLabel = (geo: string) => {
    switch (geo) {
      case 'Ethiopia':
        return t.geographies.ethiopia;
      case 'Africa':
        return t.geographies.africa;
      case 'Cross-border':
        return t.geographies.crossBorder;
      case 'Global':
        return t.geographies.global;
      default:
        return geo;
    }
  };

  return (
    <article
      className={`rounded-xl border transition-all duration-150 p-5 flex flex-col justify-between ${
        isStarred
          ? 'bg-[#121936] border-amber-500/60 shadow-md'
          : isHighPriority
          ? 'bg-[#0b1328] border-[#1d2d57] hover:border-orange-500/50 shadow-sm'
          : 'bg-[#091024] border-[#162345] hover:border-slate-600/40'
      }`}
    >
      <div>
        {/* Top Badges Strip: Previous Categorization Taxonomy */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Geography badge */}
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-[#162a52] text-cyan-300 border border-cyan-500/30">
              {getGeographyLabel(article.geography || 'Global')}
            </span>

            {/* Category badge */}
            <button
              onClick={() => onFilterByCategory && onFilterByCategory(article.category)}
              className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#182344] text-orange-300 hover:text-white border border-[#233566] transition-colors cursor-pointer"
            >
              {getCategoryLabel(article.category || 'Transformation Initiative / Strategy Announcement')}
            </button>

            {/* Language badge */}
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#0f1d3b] text-slate-300 border border-[#213566]">
              {article.language === 'am' ? 'አማ' : article.language === 'om' ? 'OM' : 'EN'}
            </span>

            {/* Verification status badge */}
            {article.verification_status === 'verified' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                {t.verifiedLink}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-900/60 border border-slate-700/50 px-1.5 py-0.5 rounded">
                {t.unverifiedLink}
              </span>
            )}

            {/* Paywall Label */}
            {article.is_paywalled && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                {t.paywalled}
              </span>
            )}
          </div>

          {/* Relevance Score Pill */}
          <div className="flex items-center gap-1">
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                article.relevance_score >= 8
                  ? 'bg-orange-950/80 text-orange-400 border-orange-500/50'
                  : article.relevance_score >= 6
                  ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {t.relevanceScore}: {article.relevance_score}/10
            </span>
          </div>
        </div>

        {/* Source Name */}
        <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400 font-medium">
          <span className="text-white font-bold">{article.source_name}</span>
          <span>·</span>
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {article.published_at ? article.published_at.split('T')[0] : 'N/A'}
          </span>
        </div>

        {/* Original Title (NEVER generated by LLM) */}
        <h3 className="text-base font-bold text-white leading-snug mb-2 group">
          <a
            href={article.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-400 transition-colors inline"
          >
            {article.title_original}
          </a>
        </h3>

        {/* Grounded Summary */}
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-2.5">
          {article.summary_ai || article.raw_text}
        </p>

        {/* Strategic Takeaway if present */}
        {article.takeaway && (
          <div className="mb-3 p-2.5 rounded-lg bg-[#0d1733] border-l-3 border-orange-500/80 text-[11px] text-slate-300">
            <strong className="text-orange-400 font-semibold block mb-0.5">{t.strategicTakeaway}:</strong>
            <span>{article.takeaway}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {article.tags.map((tag, idx) => {
            const themeObj = THEME_BY_ID[tag as ThemeId];
            const label = themeObj ? themeObj.label : tag;
            const chipClass = themeObj
              ? themeObj.chip
              : 'bg-[#121c38] text-slate-300 hover:text-orange-300 border-[#1e2f59]';

            return (
              <button
                key={idx}
                onClick={() => onFilterByTag && onFilterByTag(tag)}
                className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${chipClass}`}
              >
                <Tag className="w-2.5 h-2.5 opacity-70" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Expandable "Why it matters to Awash" for score >= 7 */}
        {article.awash_implication && (
          <div className="mb-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{t.whyItMatters}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isExpanded && (
              <div className="mt-2 p-3 rounded-lg bg-[#142042] border-l-4 border-orange-500 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-orange-400 block mb-1">{t.soWhatForAwash}:</span>
                <p className="font-medium">{article.awash_implication}</p>
                {article.relevance_reason && (
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">{article.relevance_reason}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Syndicated duplicates indicator */}
        {article.syndicated_sources && article.syndicated_sources.length > 0 && (
          <div className="mb-3 p-2 rounded bg-[#0d162d] border border-[#1b2b52] text-[11px] text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>
              Syndicated on {article.syndicated_sources.length} other sources:{' '}
              <strong className="text-slate-300">
                {article.syndicated_sources.map((s) => s.source_name).join(', ')}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Card Action Buttons Bar */}
      <div className="pt-3 border-t border-[#172547] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {/* View Original */}
          <a
            href={article.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <span>{t.viewOriginal}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Cached Copy */}
          <button
            onClick={() => onViewCachedCopy(article)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#142347] hover:bg-[#1d3161] text-slate-200 border border-[#23386e] font-medium transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.cachedCopy}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Star Button */}
          <button
            onClick={() => onAction(article.id, 'star')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isStarred
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                : 'bg-[#142347] hover:bg-[#1d3161] text-slate-300 hover:text-amber-400 border-[#23386e]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
            <span>{isStarred ? t.starred : t.star}</span>
          </button>

          {/* Archive Button */}
          <button
            onClick={() => onAction(article.id, 'archive')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#142347] hover:bg-[#1d3161] hover:text-red-400 text-slate-400 border border-[#23386e] text-xs font-medium transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{t.archive}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
