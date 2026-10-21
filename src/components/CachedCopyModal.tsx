import React from 'react';
import { X, ExternalLink, Copy, Check, ShieldCheck, Hash, Calendar, Globe } from 'lucide-react';
import { StoredArticle } from '../server/db';

interface CachedCopyModalProps {
  article: StoredArticle | null;
  onClose: () => void;
}

export const CachedCopyModal: React.FC<CachedCopyModalProps> = ({ article, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!article) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(article.raw_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0b1328] rounded-xl border border-[#1e2f59] w-full max-w-3xl overflow-hidden shadow-2xl my-8 text-xs text-slate-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1b2b52] bg-[#080e1e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Stored Raw Article Snapshot (Ground Truth)</h3>
              <p className="text-xs text-slate-400">
                Unaltered raw text ingested directly from the publisher. LLM summaries are strictly bounded to this snapshot.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata info strip */}
        <div className="px-6 py-3 bg-[#0d1730] border-b border-[#1b2b52] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate">{article.source_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>Fetched: {article.fetched_at ? article.fetched_at.replace('T', ' ').slice(0, 19) : 'Recent'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 truncate">
            <Hash className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate" title={article.content_hash}>
              SHA-256: {article.content_hash.slice(0, 14)}...
            </span>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white leading-snug mb-1">{article.title_original}</h4>
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 break-all"
            >
              <span>{article.original_url}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Raw Stored Content:</span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#162447] hover:bg-[#203366] text-slate-200 transition-colors cursor-pointer border border-[#2b3e70]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy Raw Text'}</span>
              </button>
            </div>
            <div className="p-4 bg-[#060a16] border border-[#1b2b52] rounded-lg max-h-80 overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
              {article.raw_text}
            </div>
          </div>

          {article.syndicated_sources && article.syndicated_sources.length > 0 && (
            <div className="p-3 bg-[#0d1833] border border-[#1e2f59] rounded-lg">
              <span className="font-semibold text-orange-400 block mb-1">
                Syndicated Duplicate Distribution ({article.syndicated_sources.length} other sources):
              </span>
              <ul className="space-y-1 text-slate-300">
                {article.syndicated_sources.map((s, idx) => (
                  <li key={idx} className="flex items-center justify-between text-[11px]">
                    <span>• {s.source_name}</span>
                    <a
                      href={s.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:underline flex items-center gap-1"
                    >
                      <span>Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1b2b52] bg-[#080e1e] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Verification status: <strong className="text-emerald-400 uppercase">{article.verification_status}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#19274c] hover:bg-[#23376b] text-white font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
