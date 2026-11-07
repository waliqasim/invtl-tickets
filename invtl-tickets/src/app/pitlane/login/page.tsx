'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserDb } from '@/lib/supabase-browser';
import CreatedBy from '@/components/registrations/CreatedBy';

const label = 'font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400';
const input =
  'w-full rounded-none border-0 border-b border-neutral-600 bg-transparent pb-2 pt-2 text-[17px] text-white focus:border-b-2 focus:border-white focus:outline-none';

export default function PitlaneLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const db = browserDb();
    const { error: err } = await db.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setBusy(false);
      return setError(err.message === 'Invalid login credentials' ? 'Wrong email or password.' : err.message);
    }
    const res = await fetch('/api/pitlane/registrations', { cache: 'no-store' });
    if (res.status === 401) {
      await db.auth.signOut();
      setBusy(false);
      return setError("This account doesn't have Pitlane access for tickets.");
    }
    router.replace('/pitlane/registrations');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-white">
      <form onSubmit={submit} className="w-full max-w-sm border border-white p-7">
        <div className="font-mono text-xs tracking-[0.2em]">PITLANE · TICKETS</div>
        <h1 className="mb-6 mt-2 text-2xl font-bold uppercase">Sign in</h1>
        {error && (
          <div role="alert" className="mb-4 flex gap-2.5 border border-white px-3.5 py-3 text-sm">
            <b className="pt-0.5 font-mono text-[11px] tracking-[0.14em]">ERROR</b>
            <span>{error}</span>
          </div>
        )}
        <label className="mb-5 flex flex-col gap-1.5">
          <span className={label}>Email</span>
          <input className={input} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="mb-6 flex flex-col gap-1.5">
          <span className={label}>Password</span>
          <input className={input} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button disabled={busy} className="h-12 w-full bg-white font-bold uppercase tracking-[0.2em] text-black disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-4 text-xs text-neutral-500">Same email and password as your main Pitlane.</p>
      </form>
      <div className="mt-8"><CreatedBy /></div>
    </main>
  );
}
