'use client';

// Live "people registered" counter. Refreshes every 15 seconds and when the tab comes back into view.
import { useEffect, useState } from 'react';

const label = 'font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400';

export default function LiveCount({
  eventId,
  initialHeads,
  initialCapacity,
}: {
  eventId: string;
  initialHeads: number;
  initialCapacity: number | null;
}) {
  const [heads, setHeads] = useState(initialHeads);
  const [capacity, setCapacity] = useState(initialCapacity);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/headcount?event=${eventId}&t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        if (typeof data.heads === 'number') setHeads(data.heads);
        setCapacity(data.capacity ?? null);
      } catch {
        /* keep the last number if the network blips */
      }
    }
    refresh();
    const timer = setInterval(refresh, 15000);
    const onShow = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener('pageshow', refresh);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onShow);
      window.removeEventListener('pageshow', refresh);
    };
  }, [eventId]);

  const left = capacity !== null ? Math.max(0, capacity - heads) : null;

  return (
    <div>
      <p className={label}>People registered</p>
      <p className="font-mono">
        <span className="text-[clamp(48px,7vw,72px)] font-medium leading-none tabular-nums">{heads}</span>
        {capacity !== null && <span className="text-lg text-neutral-400"> / {capacity}</span>}
      </p>
      {capacity !== null && (
        <>
          <div className="relative mb-2.5 mt-4 h-0.5 bg-neutral-800">
            <div className="absolute inset-y-0 left-0 bg-white transition-[width] duration-500" style={{ width: `${Math.min(100, (heads / Math.max(1, capacity)) * 100)}%` }} />
          </div>
          <p className={label}>{left} spots left</p>
        </>
      )}
    </div>
  );
}
