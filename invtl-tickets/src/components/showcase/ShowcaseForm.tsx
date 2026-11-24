'use client';

// Showcase car registration. Saves into the same vehicle_submissions list the INVTL Pitlane reviews.
import { useState } from 'react';
import { browserDb } from '@/lib/supabase-browser';

type EventOption = { id: string; title: string; event_date: string };

const label = 'font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400';
const input =
  'w-full rounded-none border-0 border-b border-neutral-600 bg-transparent pb-2 pt-2 text-[17px] text-white placeholder:text-neutral-600 focus:border-b-2 focus:border-white focus:outline-none';

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function ShowcaseForm({ events }: { events: EventOption[] }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    if (file.size > 10 * 1024 * 1024) return setPhotoError('That photo is over 10 MB. Pick a smaller one.');
    setUploading(true);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `submissions/${crypto.randomUUID()}.${ext}`;
    const db = browserDb();
    const { error: upErr } = await db.storage.from('site-media').upload(path, file);
    if (upErr) {
      setPhotoError(`The photo didn't upload (${upErr.message}). You can still submit without it.`);
    } else {
      setPhotoUrl(db.storage.from('site-media').getPublicUrl(path).data.publicUrl);
    }
    setUploading(false);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? '');
    if (!get('event_id')) return setError("Pick the show you're registering for.");
    if (!get('owner_name').trim()) return setError("Add the owner's name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get('email').trim())) return setError("That email doesn't look right.");
    if (!get('vehicle_make').trim() || !get('vehicle_model').trim()) return setError("Add the car's make and model.");
    if (!/^[A-Z0-9][A-Z0-9 -]{0,8}[A-Z0-9]$/.test(get('license_plate').trim().toUpperCase()))
      return setError("Add the car's license plate (letters and numbers only).");

    setStatus('sending');
    try {
      const res = await fetch('/api/vehicle-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: get('event_id'),
          owner_name: get('owner_name'),
          email: get('email'),
          phone: get('phone'),
          instagram: get('instagram'),
          vehicle_year: get('vehicle_year'),
          vehicle_make: get('vehicle_make'),
          vehicle_model: get('vehicle_model'),
          license_plate: get('license_plate'),
          vehicle_notes: get('vehicle_notes'),
          photo_url: photoUrl,
          company: get('company'),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('idle');
        return setError(data.error ?? `Something went wrong (${res.status}). Try again.`);
      }
      setStatus('done');
    } catch {
      setStatus('idle');
      setError("Couldn't reach INVTL. Check your connection and try again.");
    }
  }

  if (events.length === 0) {
    return (
      <div className="border border-neutral-800 px-7 py-10 text-center">
        <p className={label}>Closed</p>
        <h2 className="mb-2.5 mt-2 text-3xl font-bold uppercase">No shows open</h2>
        <p className="text-neutral-400">Car registration opens once the next show is announced. Follow @theinvtl.</p>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="border border-white p-6 sm:p-8">
        <p className={label}>Received</p>
        <h2 className="mb-2.5 mt-2 text-3xl font-bold uppercase">Your car is in for review</h2>
        <p className="text-neutral-400">
          We review every car before the show and will reach out if you&apos;re confirmed. Coming to watch as well? Your
          passengers can grab a free <a href="/spectator" className="text-white underline underline-offset-4">spectator ticket</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="border border-white p-6 sm:p-8">
      <h2 className="text-[26px] font-bold uppercase tracking-wide">Register your car</h2>
      <p className="mb-6 text-sm text-neutral-400">Takes about a minute.</p>

      {error && (
        <div role="alert" className="mb-5 flex gap-2.5 border border-white px-3.5 py-3 text-sm">
          <b className="pt-0.5 font-mono text-[11px] tracking-[0.14em]">ERROR</b>
          <span>{error}</span>
        </div>
      )}

      <label className="mb-5 flex flex-col gap-1.5">
        <span className={label}>Show</span>
        <select name="event_id" defaultValue="" className={`${input} bg-black`}>
          <option value="" disabled>Select a show</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.title} — {formatDate(e.event_date)}</option>
          ))}
        </select>
      </label>

      <label className="mb-5 flex flex-col gap-1.5">
        <span className={label}>Owner name</span>
        <input name="owner_name" autoComplete="name" maxLength={100} className={input} />
      </label>
      <div className="grid gap-x-5 sm:grid-cols-2">
        <label className="mb-5 flex flex-col gap-1.5">
          <span className={label}>Email</span>
          <input name="email" type="email" inputMode="email" autoComplete="email" className={input} placeholder="you@email.com" />
        </label>
        <label className="mb-5 flex flex-col gap-1.5">
          <span className={label}>Phone (optional)</span>
          <input name="phone" type="tel" autoComplete="tel" className={input} />
        </label>
      </div>
      <label className="mb-5 flex flex-col gap-1.5">
        <span className={label}>Instagram (optional)</span>
        <input name="instagram" className={input} placeholder="@yourname" />
      </label>

      <div className="grid gap-x-5 sm:grid-cols-[90px_1fr_1fr]">
        <label className="mb-5 flex flex-col gap-1.5">
          <span className={label}>Year</span>
          <input name="vehicle_year" inputMode="numeric" maxLength={4} className={input} placeholder="2022" />
        </label>
        <label className="mb-5 flex flex-col gap-1.5">
          <span className={label}>Make</span>
          <input name="vehicle_make" className={input} placeholder="Porsche" />
        </label>
        <label className="mb-5 flex flex-col gap-1.5">
          <span className={label}>Model</span>
          <input name="vehicle_model" className={input} placeholder="911 GT3" />
        </label>
      </div>

      <label className="mb-5 flex flex-col gap-1.5">
        <span className={label}>License plate</span>
        <input
          name="license_plate"
          maxLength={10}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="ABC1234"
          onChange={(e) => (e.currentTarget.value = e.currentTarget.value.toUpperCase())}
          className={`${input} font-mono uppercase tracking-[0.12em]`}
        />
      </label>

      <label className="mb-5 flex flex-col gap-1.5">
        <span className={label}>Mods / notes (optional)</span>
        <textarea name="vehicle_notes" rows={3} className={`${input} resize-none`} />
      </label>

      <div className="mb-6 flex flex-col gap-3">
        <span className={label}>Photo (optional)</span>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-40 w-full border border-neutral-800 object-cover" />
        )}
        <label className="w-fit cursor-pointer border border-neutral-600 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-300 hover:border-white">
          {uploading ? 'Uploading…' : photoUrl ? 'Replace photo' : 'Upload photo'}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
        </label>
        {photoError && <p className="text-sm text-neutral-300">{photoError}</p>}
      </div>

      {/* Honeypot: hidden from people, bots fill it in */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      <button
        type="submit"
        disabled={status === 'sending' || uploading}
        className="relative h-[58px] w-full overflow-hidden bg-white font-sans text-base font-bold uppercase tracking-[0.2em] text-black disabled:cursor-wait disabled:opacity-80"
      >
        {status === 'sending' ? 'Sending…' : 'Submit my car →'}
      </button>
      <p className="mt-3.5 text-[12.5px] text-neutral-400">This registers your car for review. It isn&apos;t a spectator ticket.</p>
    </form>
  );
}
