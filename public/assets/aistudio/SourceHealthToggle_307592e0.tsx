// SourceHealthToggle.tsx — ON/OFF (pause/resume) per source for the Source Health tab.
// Paused sources are never polled (scheduled or "Poll Now") and their status shows "Paused".
// Optional snooze: pause for 1h / 24h / 7d, or until you switch it back on.

import React, { useEffect, useState } from 'react';

const LS_KEY = 'pulse.pause.v1';
type PauseMap = Record<string, number | 'manual'>; // id -> resume timestamp (ms) or 'manual'

// ---------- state ----------
export function usePause() {
  const [map, setMap] = useState<PauseMap>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
  });
  const [, tick] = useState(0);

  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(map)); } catch {} }, [map]);
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 30_000); return () => clearInterval(t); }, []); // auto-resume

  const isPaused = (id: string) => {
    const v = map[id];
    if (v === undefined) return false;
    if (v === 'manual') return true;
    return Date.now() < v;
  };
  const pause = (id: string, ms?: number) => setMap(m => ({ ...m, [id]: ms ? Date.now() + ms : 'manual' }));
  const resume = (id: string) => setMap(m => { const { [id]: _, ...rest } = m; return rest; });
  const pauseMany = (ids: string[], ms?: number) => ids.forEach(id => pause(id, ms));
  const resumeMany = (ids: string[]) => ids.forEach(resume);
  const resumeAt = (id: string) => (typeof map[id] === 'number' ? (map[id] as number) : null);

  return { isPaused, pause, resume, pauseMany, resumeMany, resumeAt };
}

// ---------- GUARD: put this in the scheduler AND in the Poll Now handler ----------
// if (isPaused(source.id)) return;   // skip fetch entirely

// ---------- switch ----------
const Switch: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({ on, onChange, label }) => (
  <button
    role="switch" aria-checked={on} aria-label={label} onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-600'}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

const SNOOZE = [
  { label: '1 hour', ms: 3_600_000 },
  { label: '24 hours', ms: 86_400_000 },
  { label: '7 days', ms: 604_800_000 },
  { label: 'Until I turn it on', ms: undefined as number | undefined },
];

// ---------- toggle cell: drop into each Source Health row ----------
export const SourceToggle: React.FC<{
  id: string; name: string;
  paused: boolean; resumeAt: number | null;
  onPause: (ms?: number) => void; onResume: () => void;
}> = ({ id, name, paused, resumeAt, onPause, onResume }) => {
  const [menu, setMenu] = useState(false);
  return (
    <div className="relative flex items-center gap-2">
      <Switch
        on={!paused} label={`${paused ? 'Resume' : 'Pause'} ${name}`}
        onChange={() => (paused ? onResume() : setMenu(m => !m))}
      />
      <span className={`text-xs ${paused ? 'text-amber-400' : 'text-emerald-400'}`}>
        {paused ? (resumeAt ? `Paused · back ${new Date(resumeAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Paused') : 'On'}
      </span>
      {menu && !paused && (
        <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-slate-600 bg-slate-800 p-1 shadow-xl">
          <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-slate-400">Pause {name} for</div>
          {SNOOZE.map(o => (
            <button key={o.label} className="block w-full rounded px-2 py-1.5 text-left text-sm text-slate-100 hover:bg-slate-700"
              onClick={() => { onPause(o.ms); setMenu(false); }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- status + Poll Now cell: replace your existing ones ----------
export const StatusBadge: React.FC<{ paused: boolean; status: string }> = ({ paused, status }) =>
  paused
    ? <span className="rounded-full border border-slate-500 bg-slate-700/50 px-3 py-1 text-xs text-slate-300">⏸ Paused</span>
    : <span>{status}</span>; // keep your existing OK (200) / Pending badge here

export const PollNowButton: React.FC<{ paused: boolean; onClick: () => void }> = ({ paused, onClick }) => (
  <button
    disabled={paused} onClick={onClick} title={paused ? 'Source is paused' : 'Poll now'}
    className={`rounded-lg border px-3 py-2 text-sm ${paused ? 'cursor-not-allowed border-slate-700 text-slate-500' : 'border-slate-500 text-slate-100 hover:bg-slate-700'}`}
  >
    ⟳ Poll Now
  </button>
);

// ---------- bulk controls for the header of Source Health ----------
export const BulkPause: React.FC<{
  ids: string[]; onPause: (ids: string[], ms?: number) => void; onResume: (ids: string[]) => void;
}> = ({ ids, onPause, onResume }) => (
  <div className="flex gap-2 text-xs">
    <button className="rounded border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-700" onClick={() => onPause(ids)}>Pause all shown</button>
    <button className="rounded border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-700" onClick={() => onResume(ids)}>Resume all shown</button>
  </div>
);

/* ---------- Usage in a Source Health row ----------
const { isPaused, pause, resume, resumeAt, pauseMany, resumeMany } = usePause();
...
<SourceToggle id={s.id} name={s.name} paused={isPaused(s.id)} resumeAt={resumeAt(s.id)}
  onPause={ms => pause(s.id, ms)} onResume={() => resume(s.id)} />
<StatusBadge paused={isPaused(s.id)} status={<your existing badge/>} />
<PollNowButton paused={isPaused(s.id)} onClick={() => pollNow(s)} />
*/
