import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Play,
} from 'lucide-react';
import { AuditRow, Verdict, THRESHOLDS } from '../relevance';

export const RelevanceAuditView: React.FC = () => {
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDecision, setFilterDecision] = useState<'all' | 'kept' | 'dropped'>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive tester state
  const [testUrl, setTestUrl] = useState('https://nbe.gov.et/directive-digital-payment-2026');
  const [testTitle, setTestTitle] = useState('NBE Issues New Directive on Digital Payments & Interoperability Rails');
  const [testText, setTestText] = useState('The National Bank of Ethiopia today announced a new regulatory directive for commercial banks including Awash Bank to expand EthSwitch QR code standard and core banking composability.');
  const [testPubDate, setTestPubDate] = useState(new Date().toISOString().slice(0, 10));
  const [testGeo, setTestGeo] = useState<'Ethiopia' | 'Africa' | 'Cross-border' | 'Global'>('Ethiopia');
  const [testTier, setTestTier] = useState<1 | 2 | 3>(1);
  const [evaluating, setEvaluating] = useState(false);
  const [testVerdict, setTestVerdict] = useState<Verdict | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/relevance/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditRows(data.audit || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/relevance/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: {
            title: testTitle,
            url: testUrl,
            text: testText,
            publishedAt: testPubDate ? `${testPubDate}T12:00:00Z` : undefined,
          },
          source: {
            id: 'test-src',
            name: 'Test Source Channel',
            url: testUrl,
            group: 'Regulators',
            geography: testGeo,
            tier: testTier,
            enabled: true,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestVerdict(data.verdict);
      }
    } catch {
      // ignore
    } finally {
      setEvaluating(false);
    }
  };

  const filteredAudit = auditRows.filter((r) => {
    if (filterDecision !== 'all' && r.decision !== filterDecision) return false;
    if (filterStage !== 'all' && r.stage !== filterStage) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.url.toLowerCase().includes(q) && !r.sourceId.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const keptCount = auditRows.filter((r) => r.decision === 'kept').length;
  const droppedCount = auditRows.filter((r) => r.decision === 'dropped').length;

  return (
    <div className="space-y-6">
      {/* Top Banner explaining the Pipeline */}
      <div className="p-4 rounded-xl bg-[#0b1226] border border-[#1b2b52] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Sliders className="w-4 h-4" />
            <h3 className="text-sm font-bold tracking-wide uppercase">Multi-Stage Relevance & Ingestion Gate</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Every candidate feed item passes sequentially through: <strong>1. Domain Grounding</strong> &rarr;{' '}
            <strong>2. Freshness Gate (Max 5 days)</strong> &rarr; <strong>3. Hard Blocks & Rate Tables</strong> &rarr;{' '}
            <strong>4. Weighted Scoring (&ge;{THRESHOLDS.keep} keep, &ge;{THRESHOLDS.borderline} borderline)</strong> &rarr;{' '}
            <strong>5. Gemini AI Screen</strong> &rarr; <strong>6. Dedup</strong>. Every drop is logged with an audit trail.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={fetchAudit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142142] hover:bg-[#1a2b54] text-xs font-medium text-slate-200 border border-[#233566] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Audit
          </button>
        </div>
      </div>

      {/* Interactive Relevance Tester */}
      <div className="p-4 rounded-xl bg-[#0e1730] border border-[#1e2f5c] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Interactive Relevance Evaluator (Live Pipeline Tester)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Tests full regex, rate-table, freshness, and entity matcher</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Headline / Title</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#090f20] border border-[#1e2d54] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Article headline..."
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Target Article URL</label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#090f20] border border-[#1e2d54] rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="https://example.com/..."
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Body Snippet / Text Extract</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs bg-[#090f20] border border-[#1e2d54] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Article snippet or full text..."
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Publish Date</label>
                <input
                  type="date"
                  value={testPubDate}
                  onChange={(e) => setTestPubDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-[#090f20] border border-[#1e2d54] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Geography</label>
                <select
                  value={testGeo}
                  onChange={(e) => setTestGeo(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs bg-[#090f20] border border-[#1e2d54] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Ethiopia">Ethiopia</option>
                  <option value="Africa">Africa</option>
                  <option value="Cross-border">Cross-border</option>
                  <option value="Global">Global</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Source Tier</label>
                <select
                  value={testTier}
                  onChange={(e) => setTestTier(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full px-2 py-1.5 text-xs bg-[#090f20] border border-[#1e2d54] rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>Tier 1 (Official)</option>
                  <option value={2}>Tier 2 (Reputable)</option>
                  <option value={3}>Tier 3 (Social)</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleRunEvaluation}
              disabled={evaluating}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {evaluating ? 'Evaluating Pipeline...' : 'Run Relevance Screening'}
            </button>
          </div>

          {/* Result Card */}
          <div className="bg-[#090f20] border border-[#1a284e] rounded-xl p-4 flex flex-col justify-between">
            {testVerdict ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#1b2b52] pb-3">
                  <div className="flex items-center gap-2">
                    {testVerdict.keep ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Verdict: KEPT
                      </span>
                    ) : testVerdict.borderline ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                        Verdict: BORDERLINE (GEMINI SCREEN)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        Verdict: DROPPED
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Calculated Score</span>
                    <span className="text-base font-bold font-mono text-white">
                      {testVerdict.score.toFixed(1)} / 10
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Filter Exit Stage:</span>
                    <span className="font-mono text-indigo-300 font-semibold">{testVerdict.stage}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Keep Threshold:</span>
                    <span className="font-mono text-emerald-400">&ge; {THRESHOLDS.keep}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Borderline Threshold:</span>
                    <span className="font-mono text-amber-400">&ge; {THRESHOLDS.borderline}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Pipeline Decision Factors & Scoring Signals:
                  </span>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {testVerdict.reasons.map((r, i) => (
                      <div
                        key={i}
                        className={`text-[11px] px-2 py-1 rounded font-mono ${
                          r.startsWith('+')
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                            : r.startsWith('-') || r.includes('too old') || r.includes('drop') || r.includes('block')
                            ? 'bg-red-950/60 text-red-300 border border-red-800/40'
                            : 'bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Sliders className="w-10 h-10 text-slate-600 mb-2 opacity-50" />
                <p className="text-xs font-medium text-slate-400">Run evaluation to inspect the live decision flow</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  See how the article is tested against hard block regexes, freshness limits, currency rate-tables, entity extractors, and theme weights.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Controls & Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d162f] p-3 rounded-xl border border-[#1b2b52]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Filter Decision:</span>
          <div className="inline-flex rounded-lg bg-[#070c1a] p-0.5 border border-[#1e2f5c]">
            <button
              onClick={() => setFilterDecision('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterDecision === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({auditRows.length})
            </button>
            <button
              onClick={() => setFilterDecision('kept')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterDecision === 'kept' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kept ({keptCount})
            </button>
            <button
              onClick={() => setFilterDecision('dropped')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterDecision === 'dropped' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dropped ({droppedCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#070c1a] border border-[#1b2b52] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0b1226] rounded-xl border border-[#1b2b52] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1b2b52] bg-[#080d1c] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Headline & Target URL</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Audit Reasons / Drop Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152345] text-xs text-slate-300 font-sans">
              {filteredAudit.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No audit events match current criteria</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Run a synchronization pass or single source poll to log live pipeline decisions.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAudit.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#0e1733] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {row.decision === 'kept' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Kept
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                          <XCircle className="w-3 h-3 text-red-400" />
                          Dropped
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-sm sm:max-w-md">
                      <span className="font-medium text-white block line-clamp-1">{row.title}</span>
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-indigo-400 font-mono truncate block flex items-center gap-1 mt-0.5"
                      >
                        <span className="truncate">{row.url}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#172547] text-indigo-300 font-mono text-[11px] border border-[#233566]">
                        {row.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">
                      <span className={row.score >= THRESHOLDS.keep ? 'text-emerald-400' : 'text-slate-400'}>
                        {row.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="flex flex-wrap gap-1">
                        {row.reasons.map((r, ridx) => (
                          <span
                            key={ridx}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              r.startsWith('+')
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                                : r.startsWith('-') || r.includes('too old') || r.includes('drop') || r.includes('block')
                                ? 'bg-red-950/70 text-red-300 border border-red-800/40'
                                : 'bg-[#152345] text-slate-300'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
