'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreatedBy from './CreatedBy';

type Props = {
  code: string;
  number: string;
  name: string;
  party: number;
  status: 'valid' | 'checked_in' | 'cancelled';
  eventTitle: string;
  dateDots: string;
  timeLabel: string;
  venue: string;
  image: string | null;
  gateWord: string | null;
  existing: boolean;
};

const label = 'font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400';

export default function PassCard(p: Props) {
  const router = useRouter();
  const [now, setNow] = useState<string>('');
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'done'; text: string } | null>(null);

  // Live clock, ticking every second. A screenshot freezes it.
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Pick up check-in status changes (e.g. staff check them in) without a manual refresh
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(id);
  }, [router]);

  async function cancel() {
    setMsg(null);
    const res = await fetch('/api/pass/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: p.code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ kind: 'error', text: data.error ?? `Couldn't cancel (${res.status}).` });
    setConfirming(false);
    setMsg({ kind: 'done', text: 'Pass cancelled. Your spot has been released.' });
    router.refresh();
  }

  const badge =
    p.status === 'checked_in'
      ? { text: 'CHECKED IN', cls: 'bg-white text-black border-white', dot: 'bg-black' }
      : p.status === 'cancelled'
        ? { text: 'CANCELLED', cls: 'border-neutral-600 text-neutral-500', dot: 'bg-neutral-600' }
        : { text: 'VALID', cls: 'border-white', dot: 'bg-white invtl-pulse' };

  return (
    <div className="mx-auto grid max-w-6xl justify-items-center gap-7 px-4 py-6 md:grid-cols-[auto_1fr] md:items-start md:justify-items-stretch md:gap-14 md:py-12">
      {/* The pass itself */}
      <div className="relative flex min-h-[calc(100svh-48px)] w-full max-w-[380px] flex-col overflow-hidden border border-neutral-800 bg-black md:min-h-[690px] md:rounded-[34px]">
        <div className="invtl-shimmer" />
        <div className="px-5 pb-3.5 pt-6 text-center">
          <div className="font-sans text-xl font-bold tracking-[0.32em]">INVTL</div>
          <div className={`${label} mt-1.5`}>Invitational pass</div>
        </div>
        <div className="h-[120px] overflow-hidden bg-neutral-900">
          {p.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt="" className="invtl-drift h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1 px-[22px] pt-5">
          <div className="font-sans text-[84px] font-bold leading-[0.9] tracking-tight tabular-nums">
            <small className="mr-1 align-top text-[30px] font-medium">Nº</small>
            {p.number}
          </div>
          <div className="mb-[18px] mt-2.5 break-words text-2xl font-bold uppercase tracking-wide">{p.name}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 border-t border-neutral-800 pt-3.5">
            <div><div className={label}>Event</div><div className="mt-0.5 font-mono text-[13px] uppercase">{p.eventTitle}</div></div>
            <div><div className={label}>Date</div><div className="mt-0.5 font-mono text-[13px]">{p.dateDots}</div></div>
            {p.venue && <div><div className={label}>Venue</div><div className="mt-0.5 font-mono text-[13px] uppercase">{p.venue}</div></div>}
            <div><div className={label}>Party</div><div className="mt-0.5 font-mono text-[13px]">{p.party} {p.party > 1 ? 'GUESTS' : 'GUEST'}</div></div>
          </div>
          <div className={`mt-[18px] inline-flex items-center gap-2 border px-2.5 py-1.5 font-mono text-[11px] tracking-[0.16em] ${badge.cls}`}>
            <i className={`h-[7px] w-[7px] rounded-full ${badge.dot}`} />
            {badge.text}
          </div>
        </div>
        <div className="relative mt-5 overflow-hidden bg-white px-[22px] pb-[18px] pt-3.5 text-black">
          <div className="invtl-shimmer invtl-shimmer-dark" />
          <div className="flex items-baseline justify-between gap-2.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-500">Live</span>
            <span className="font-mono text-[22px] font-semibold tabular-nums" suppressHydrationWarning>{now || '--:--:--'}</span>
          </div>
          {p.gateWord && (
            <div className="mt-1.5 font-mono text-[11px] tracking-[0.14em]">
              GATE WORD: <b className="text-[15px] tracking-[0.2em]">{p.gateWord}</b>
            </div>
          )}
        </div>
        <div className="flex justify-center bg-black px-4 py-3">
          <CreatedBy />
        </div>
      </div>

      {/* Below the pass on phones, beside it on desktop */}
      <div className="min-w-0 w-full max-w-[380px] md:max-w-none">
        {p.existing && (
          <div className="mb-4 flex gap-2.5 border border-white px-3.5 py-3 text-sm">
            <b className="pt-0.5 font-mono text-[11px] tracking-[0.14em]">NOTE</b>
            <span>That email already had a pass for this show. Here it is, and we&apos;ve re-sent the email.</span>
          </div>
        )}
        <h2 className="mb-3.5 text-[34px] font-bold uppercase leading-tight">Show this at the gate</h2>
        <p className="max-w-[52ch] text-neutral-300">
          Open this page on your phone when you arrive. Staff will check that the clock is ticking and the shimmer is moving{p.gateWord ? ', and that the gate word matches' : ''}. Screenshots aren&apos;t accepted.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="border border-neutral-800 p-4">
            <div className={label}>iPhone</div>
            <ol className="mt-2 list-decimal pl-4 text-sm text-neutral-300"><li>Tap Share in Safari</li><li>Tap Add to Home Screen</li></ol>
          </div>
          <div className="border border-neutral-800 p-4">
            <div className={label}>Android</div>
            <ol className="mt-2 list-decimal pl-4 text-sm text-neutral-300"><li>Tap ⋮ in Chrome</li><li>Tap Add to Home screen</li></ol>
          </div>
        </div>

        {p.status === 'valid' && !confirming && (
          <button onClick={() => setConfirming(true)} className="mt-6 border border-neutral-600 px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] hover:border-white">
            Can&apos;t make it? Cancel pass
          </button>
        )}
        {confirming && (
          <div className="mt-6 border border-white p-4 text-sm">
            <p>Cancel pass Nº {p.number}? Your spot goes to someone else.</p>
            <div className="mt-3 flex gap-2">
              <button onClick={cancel} className="bg-white px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-black">Yes, cancel</button>
              <button onClick={() => setConfirming(false)} className="border border-neutral-600 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em]">Keep my pass</button>
            </div>
          </div>
        )}
        {msg && (
          <div role="status" className="mt-4 flex gap-2.5 border border-white px-3.5 py-3 text-sm">
            <b className="pt-0.5 font-mono text-[11px] tracking-[0.14em]">{msg.kind === 'error' ? 'ERROR' : 'DONE'}</b>
            <span>{msg.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
