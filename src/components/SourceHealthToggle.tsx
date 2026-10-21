// SourceHealthToggle.tsx — ON/OFF (pause/resume) per source for the Source Health tab.
// Paused sources are never polled (scheduled or "Poll Now") and their status shows "Paused".
// Optional snooze: pause for 1h / 24h / 7d, or until you switch it back on.

import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

const LS_KEY = 'pulse.pause.v1';
export type PauseMap = Record<string, number | 'manual'>; // id -> resume timestamp (ms) or 'manual'

// ---------- state ----------
export function usePause() {
  const [map, setMap] = useState<PauseMap>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    } catch {
      return {};
    }
  });
  const [, tick] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(map));
    } catch {}
  }, [map]);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []); // auto-resume on expiry

  const isPaused = (id: string) => {
    const v = map[id];
    if (v === undefined) return false;
    if (v === 'manual') return true;
    return Date.now() < v;
  };

  const pause = (id: string, ms?: number) => {
    setMap((m) => ({ ...m, [id]: ms ? Date.now() + ms : 'manual' }));
  };

  const resume = (id: string) => {
    setMap((m) => {
      const { [id]: _, ...rest } = m;
      return rest;
    });
  };

  const pauseMany = (ids: string[], ms?: number) => {
    setMap((m) => {
      const next = { ...m };
      const val = ms ? Date.now() + ms : 'manual';
      ids.forEach((id) => {
        next[id] = val;
      });
      return next;
    });
  };

  const resumeMany = (ids: string[]) => {
    setMap((m) => {
      const next = { ...m };
      ids.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  };

  const resumeAt = (id: string) => (typeof map[id] === 'number' ? (map[id] as number) : null);

  const getPausedIds = () => Object.keys(map).filter(isPaused);

  return { isPaused, pause, resume, pauseMany, resumeMany, resumeAt, getPausedIds, pauseMap: map };
}

// ---------- switch ----------
export const Switch: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({
  on,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-hidden ${
      on ? 'bg-emerald-500' : 'bg-slate-700'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
        on ? 'translate-x-4.5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

export const SNOOZE = [
  { label: '1 hour', ms: 3_600_000 },
  { label: '24 hours', ms: 86_400_000 },
  { label: '7 days', ms: 604_800_000 },
  { label: 'Until I turn it on', ms: undefined as number | undefined },
];

// ---------- toggle cell: drop into each Source Health row ----------
export const SourceToggle: React.FC<{
  id: string;
  name: string;
  paused: boolean;
  resumeAt: number | null;
  onPause: (ms?: number) => void;
  onResume: () => void;
}> = ({ id: _id, name, paused, resumeAt, onPause, onResume }) => {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menu]);

  return (
    <div className="relative inline-flex items-center gap-2" ref={menuRef}>
      <Switch
        on={!paused}
        label={`${paused ? 'Resume' : 'Pause'} ${name}`}
        onChange={() => (paused ? onResume() : setMenu((m) => !m))}
      />
      <span className={`text-[11px] font-medium whitespace-nowrap ${paused ? 'text-amber-400' : 'text-emerald-400'}`}>
        {paused
          ? resumeAt
            ? `Paused · back ${new Date(resumeAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`
            : 'Paused'
          : 'Active'}
      </span>
      {menu && !paused && (
        <div className="absolute left-0 top-7 z-30 w-48 rounded-lg border border-[#223668] bg-[#0c1630] p-1.5 shadow-2xl backdrop-blur-md">
          <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 border-b border-[#1b2b52] mb-1">
            Pause feed for:
          </div>
          {SNOOZE.map((o) => (
            <button
              key={o.label}
              type="button"
              className="block w-full rounded px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-orange-600/30 hover:text-white transition-colors cursor-pointer"
              onClick={() => {
                onPause(o.ms);
                setMenu(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- status + Poll Now cell: replace your existing ones ----------
export const StatusBadge: React.FC<{ paused: boolean; status: React.ReactNode }> = ({ paused, status }) =>
  paused ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
      <span className="text-amber-400">⏸</span> Paused
    </span>
  ) : (
    <>{status}</>
  );

export const PollNowButton: React.FC<{
  paused: boolean;
  isPolling?: boolean;
  onClick: () => void;
}> = ({ paused, isPolling = false, onClick }) => (
  <button
    type="button"
    disabled={paused || isPolling}
    onClick={onClick}
    title={paused ? 'Source is paused' : 'Poll feed immediately'}
    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
      paused
        ? 'cursor-not-allowed border-slate-800 bg-slate-900/60 text-slate-600'
        : 'border-[#23386e] bg-[#16254a] text-slate-200 hover:bg-orange-600 hover:text-white hover:border-orange-500 cursor-pointer shadow-xs'
    }`}
  >
    <RefreshCw className={`w-3 h-3 ${isPolling ? 'animate-spin' : ''}`} />
    <span>{isPolling ? 'Polling...' : 'Poll Now'}</span>
  </button>
);

// ---------- bulk controls for the header of Source Health ----------
export const BulkPause: React.FC<{
  ids: string[];
  onPause: (ids: string[], ms?: number) => void;
  onResume: (ids: string[]) => void;
}> = ({ ids, onPause, onResume }) => (
  <div className="flex items-center gap-1.5 text-xs">
    <button
      type="button"
      className="rounded-lg border border-[#23386e] bg-[#111c3a] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-amber-600/30 hover:border-amber-500/50 hover:text-amber-200 transition-colors cursor-pointer flex items-center gap-1"
      onClick={() => onPause(ids)}
      title="Pause all filtered sources"
    >
      <span>⏸</span> Pause all shown ({ids.length})
    </button>
    <button
      type="button"
      className="rounded-lg border border-[#23386e] bg-[#111c3a] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
      onClick={() => onResume(ids)}
      title="Resume all filtered sources"
    >
      <span>▶</span> Resume all shown
    </button>
  </div>
);
