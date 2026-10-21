import React, { useState } from 'react';
import { Copy, Check, Download, FileText, Sparkles, RefreshCw } from 'lucide-react';

interface BriefingViewProps {
  onRefresh: () => void;
}

export const BriefingView: React.FC<BriefingViewProps> = ({ onRefresh }) => {
  const [briefingText, setBriefingText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/briefing');
      const data = await res.json();
      if (data.briefingText) {
        setBriefingText(data.briefingText);
      }
    } catch (err) {
      console.error('Failed to load briefing:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(briefingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([briefingText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Awash_Bank_Executive_Modernization_Briefing_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="p-4 rounded-xl bg-[#0d162f] border border-[#1b2b52] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Executive Intelligence Briefing (Word & PPT Ready)</h3>
            <p className="text-xs text-slate-400">
              Ranked modernization developments grouped by strategy theme, with ground-truth citations and Awash implications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBriefing}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142347] hover:bg-[#1f346b] text-slate-200 border border-[#23386e] text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Brief</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isLoading || !briefingText}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#142347] hover:bg-[#1f346b] text-slate-200 border border-[#23386e] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Download .txt</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={isLoading || !briefingText}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Briefing'}</span>
          </button>
        </div>
      </div>

      {/* Briefing Text Display */}
      <div className="bg-[#0b1328] rounded-xl border border-[#1b2b52] p-5 shadow-xl">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-mono">Compiling executive briefing from stored database records...</p>
          </div>
        ) : (
          <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all max-h-[600px] overflow-y-auto">
            {briefingText}
          </pre>
        )}
      </div>
    </div>
  );
};
