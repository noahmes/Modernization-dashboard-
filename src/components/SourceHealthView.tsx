import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  PlusCircle,
  PauseCircle,
  Sliders,
} from 'lucide-react';
import { StoredSource, FetchLogEntry } from '../server/db';
import {
  usePause,
  SourceToggle,
  StatusBadge,
  PollNowButton,
  BulkPause,
} from './SourceHealthToggle';
import { RelevanceAuditView } from './RelevanceAuditView';

interface SourceHealthViewProps {
  sources: StoredSource[];
  recentLogs: FetchLogEntry[];
  suggestedSources: Array<{ name: string; url: string; type: string }>;
  onPollSource: (id: string) => Promise<void>;
  onEnableSuggestedSource: (name: string, url: string) => Promise<void>;
}

export const SourceHealthView: React.FC<SourceHealthViewProps> = ({
  sources,
  recentLogs: _recentLogs,
  suggestedSources,
  onPollSource,
  onEnableSuggestedSource,
}) => {
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'sources' | 'audit'>('sources');

  const { isPaused, pause, resume, pauseMany, resumeMany, resumeAt } = usePause();

  const filteredSources = sources.filter((s) => {
    if (filterGroup !== 'ALL' && s.group !== filterGroup) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.url.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handlePoll = async (id: string) => {
    if (isPaused(id)) return;
    setPollingId(id);
    try {
      await onPollSource(id);
    } finally {
      setPollingId(null);
    }
  };

  const pausedCount = sources.filter((s) => isPaused(s.id)).length;
  const healthyCount = sources.filter((s) => !isPaused(s.id) && s.last_status === 'ok').length;
  const errorCount = sources.filter((s) => !isPaused(s.id) && s.last_status === 'error').length;
  const pendingCount = sources.filter((s) => !isPaused(s.id) && s.last_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Health Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0e1730] border border-[#1b2b52] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Sources</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5 block">{sources.length}</span>
          </div>
          <Activity className="w-7 h-7 text-orange-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1730] border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Active Healthy</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5 block">{healthyCount}</span>
          </div>
          <CheckCircle2 className="w-7 h-7 text-emerald-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1730] border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Paused Feeds</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-0.5 block">{pausedCount}</span>
          </div>
          <PauseCircle className="w-7 h-7 text-amber-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1730] border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Pending Ingestion</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400 mt-0.5 block">{pendingCount}</span>
          </div>
          <Clock className="w-7 h-7 text-blue-400 opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1730] border border-red-500/30 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-xs text-slate-400 block">Degraded / Error</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-red-400 mt-0.5 block">{errorCount}</span>
          </div>
          <AlertCircle className="w-7 h-7 text-red-400 opacity-80" />
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1b2b52] pb-3">
        <button
          onClick={() => setSubTab('sources')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            subTab === 'sources'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-[#0e1730] text-slate-400 hover:text-white border border-[#1b2b52]'
          }`}
        >
          <Activity className="w-4 h-4" />
          Feed Channels Registry ({sources.length})
        </button>
        <button
          onClick={() => setSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            subTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-[#0e1730] text-slate-400 hover:text-white border border-[#1b2b52]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Relevance Gate Audit & Live Screener
        </button>
      </div>

      {subTab === 'audit' ? (
        <RelevanceAuditView />
      ) : (
        <>

      {/* Suggested Extra Sources (Discovered by agent, user confirmation required) */}
      {suggestedSources.length > 0 && (
        <div className="p-4 rounded-xl bg-[#111933] border border-amber-500/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Discovered High-Signal Regulatory & Exchange Portals (Pending User Confirmation)
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Strictly requires confirmation before enabling</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            The surveillance engine discovered active official announcement pages for Ethiopian capital markets and regional central banks:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedSources.map((s, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#0b1226] border border-[#1b2b52] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block truncate">{s.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono truncate block">{s.url}</span>
                </div>
                <button
                  onClick={() => onEnableSuggestedSource(s.name, s.url)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shrink-0 cursor-pointer transition-colors shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Enable Source</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search, Filter & Bulk Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0d162f] p-3 rounded-xl border border-[#1b2b52]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search sources by name or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#080f22] border border-[#1a2b52] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            <span className="text-slate-400 font-medium shrink-0 text-[11px]">Group:</span>
            {['ALL', 'P1_ETHIOPIA_MEDIA_REG', 'P1_ETHIOPIAN_BANKS', 'OWN_BRAND', 'P2_FINTECH_MEDIA', 'P2_AFRICA_MEDIA', 'P3_AFRICAN_PEER_BANKS', 'P3_GSIB'].map((grp) => (
              <button
                key={grp}
                onClick={() => setFilterGroup(grp)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono shrink-0 transition-colors cursor-pointer ${
                  filterGroup === grp
                    ? 'bg-orange-600 text-white font-semibold'
                    : 'bg-[#132247] text-slate-300 hover:text-white'
                }`}
              >
                {grp.replace('P1_', '').replace('P2_', '').replace('P3_', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Pause / Resume Controls for current filtered view */}
        <div className="shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1a2b52]">
          <BulkPause
            ids={filteredSources.map((s) => s.id)}
            onPause={pauseMany}
            onResume={resumeMany}
          />
        </div>
      </div>

      {/* Sources Health Table */}
      <div className="bg-[#0b1328] rounded-xl border border-[#1b2b52] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#080e1e] text-slate-400 text-[11px] uppercase tracking-wider font-mono border-b border-[#1b2b52]">
              <tr>
                <th className="px-4 py-3">Source Name & Endpoint</th>
                <th className="px-4 py-3">Feed Control</th>
                <th className="px-4 py-3">Group / Priority</th>
                <th className="px-4 py-3">Poll Interval</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Items Stored</th>
                <th className="px-4 py-3">Last Polled</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152345]">
              {filteredSources.map((s) => (
                <tr key={s.id} className="hover:bg-[#101b38] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {s.is_islamic && (
                            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                              Islamic
                            </span>
                          )}
                          {s.is_paywalled && (
                            <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                              Paywalled
                            </span>
                          )}
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-400 hover:text-orange-400 flex items-center gap-1"
                        >
                          <span className="truncate max-w-xs">{s.url}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* Feed Control (ON/OFF switch + snooze menu) */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <SourceToggle
                      id={s.id}
                      name={s.name}
                      paused={isPaused(s.id)}
                      resumeAt={resumeAt(s.id)}
                      onPause={(ms) => pause(s.id, ms)}
                      onResume={() => resume(s.id)}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-slate-300 bg-[#142347] px-2 py-0.5 rounded border border-[#203463]">
                      {s.group}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono text-slate-300">
                    {s.fetch_interval >= 60 ? `${s.fetch_interval / 60}h` : `${s.fetch_interval}m`}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge
                      paused={isPaused(s.id)}
                      status={
                        s.last_status === 'ok' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                            <CheckCircle2 className="w-3 h-3" /> OK (200)
                          </span>
                        ) : s.last_status === 'error' ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded-full font-mono"
                            title={s.last_error || 'Fetch failure'}
                          >
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )
                      }
                    />
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-slate-200">
                    {s.items_count || 0}
                  </td>

                  <td className="px-4 py-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {s.last_fetched ? s.last_fetched.replace('T', ' ').slice(5, 19) : 'Not polled yet'}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <PollNowButton
                      paused={isPaused(s.id)}
                      isPolling={pollingId === s.id}
                      onClick={() => handlePoll(s.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
