'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EntryNotice from './EntryNotice';

const label = 'font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400';
const input =
  'w-full rounded-none border-0 border-b border-neutral-600 bg-transparent pb-2 pt-2 text-[17px] text-white placeholder:text-neutral-600 focus:border-b-2 focus:border-white focus:outline-none';

export default function RegisterForm({ eventId, spotsLeft }: { eventId: string; spotsLeft: number | null }) {
  const router = useRouter();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [party, setParty] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [company, setCompany] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!first.trim() || !last.trim()) return setError('Add your first and last name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("That email doesn't look right. Check it and try again.");
    if (!agreed) return setError('Tick the box to confirm you understand this is show entry only and agree to the meet rules.');
    if (spotsLeft !== null && party > spotsLeft) return setError(`Only ${spotsLeft} spots left. Lower your party size.`);

    setBusy(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, firstName: first, lastName: last, email, partySize: party, agreed, company }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Something went wrong (${res.status}). Try again.`);
        if (data.code === 'closed' || data.code === 'full') router.refresh();
        return;
      }
      const q = data.alreadyRegistered ? '?existing=1' : '';
      router.push(`/pass/${data.code}${q}`);
    } catch {
      setError("Couldn't reach INVTL. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="border border-white p-6 sm:p-8">
      <h2 className="text-[26px] font-bold uppercase tracking-wide">Claim your pass</h2>
      <p className="mb-5 text-sm text-neutral-400">Four fields. Takes about 20 seconds.</p>
      <EntryNotice className="mb-6" />

      {error && (
        <div role="alert" className="mb-4 flex gap-2.5 border border-white px-3.5 py-3 text-sm">
          <b className="pt-0.5 font-mono text-[11px] tracking-[0.14em]">ERROR</b>
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="mb-5 flex flex-col gap-1.5">
          <span className={label}>First name</span>
          <input className={input} autoComplete="given-name" value={first} onChange={(e) => setFirst(e.target.value)} maxLength={60} />
        </label>
        <label className="mb-5 flex flex-col gap-1.5">
          <span className={label}>Last name</span>
          <input className={input} autoComplete="family-name" value={last} onChange={(e) => setLast(e.target.value)} maxLength={60} />
        </label>
      </div>

      <label className="mb-5 flex flex-col gap-1.5">
        <span className={label}>Email</span>
        <input className={input} type="email" inputMode="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <div className="mb-5">
        <span className={label} id="party-label">Party size, including you</span>
        <div role="group" aria-labelledby="party-label" className="mt-2 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={party === n}
              onClick={() => setParty(n)}
              className={`h-13 h-[52px] border font-mono text-lg ${party === n ? 'border-white bg-white text-black' : 'border-neutral-600 hover:border-white'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Honeypot: hidden from people, bots fill it in */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden value={company} onChange={(e) => setCompany(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="company" />

      <label className="mb-5 mt-1 flex items-start gap-3 text-sm">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] flex-none accent-white" />
        <span>I understand this ticket is for show entry only (no car display, no parking), and I&apos;ll follow the INVTL meet rules: no burnouts, no revving, no speeding in or out.</span>
      </label>

      <button
        type="submit"
        disabled={busy}
        className="relative h-[58px] w-full overflow-hidden bg-white font-sans text-base font-bold uppercase tracking-[0.2em] text-black disabled:cursor-wait"
      >
        {busy ? 'Claiming…' : 'Claim pass →'}
        {busy && <span className="invtl-load absolute bottom-0 left-0 h-[3px] bg-black" />}
      </button>
      <p className="mt-3.5 text-[12.5px] text-neutral-400">Free entry. We only use your email to send your pass and updates about this show.</p>
    </form>
  );
}
