'use client';

// Pitlane → Registrations. Left: every event with its headcount. Right: the selected event's
// settings and guest list. Every save shows a visible success or error message.
import { useCallback, useEffect, useMemo, useState } from 'react';

type EventRow = {
  id: string;
  slug: string;
  title: string;
  dateISO: string | null;
  registrationOpen: boolean;
  capacity: number | null;
  passes: number;
  heads: number;
};
type Guest = {
  id: string;
  pass_number: number;
  first_name: string;
  last_name: string;
  email: string;
  party_size: number;
  license_plate: string | null;
  status: 'valid' | 'checked_in' | 'cancelled';
  created_at: string;
  checked_in_at: string | null;
};
type Payload = {
  events: EventRow[];
  event: { id: string; slug: string; title: string; dateISO: string | null; registrationOpen: boolean; capacity: number | null; gateWord: string | null } | null;
  rows: Guest[];
  stats: { passes: number; heads: number; checkedInHeads: number; cancelled: number } | null;
};

const label = 'font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400';
const pad = (n: number) => String(n).padStart(3, '0');
const shortDate = (iso: string | null) =>
  iso ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + 'T12:00:00' : iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';

export default function RegistrationsManager() {
  const [eventId, setEventId] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [cap, setCap] = useState('');
  const [gate, setGate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (id: string | null, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch(`/api/pitlane/registrations${id ? `?event=${id}` : ''}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Load failed (${res.status})`);
      setData(json);
      if (json.event) {
        setEventId(json.event.id);
        if (!quiet) {
          setOpen(json.event.registrationOpen);
          setCap(json.event.capacity?.toString() ?? '');
          setGate(json.event.gateWord ?? '');
        }
      }
    } catch (e) {
      setToast({ ok: false, text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(null);
  }, [load]);

  // Keep the headcount live during the show (every 20s)
  useEffect(() => {
    if (!eventId) return;
    const t = setInterval(() => load(eventId, true), 20000);
    return () => clearInterval(t);
  }, [eventId, load]);

  async function save() {
    if (!eventId) return;
    const capValue = cap.trim() === '' ? null : Number(cap);
    if (capValue !== null && (!Number.isInteger(capValue) || capValue < 1)) {
      return setToast({ ok: false, text: 'Capacity must be a whole number, or blank for no limit.' });
    }
    setSaving(true);
    try {
      const res = await fetch('/api/pitlane/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, registrationOpen: open, capacity: capValue, gateWord: gate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Save failed (${res.status})`);
      setGate(json.gateWord ?? '');
      setToast({ ok: true, text: `Registration ${open ? 'open' : 'closed'}, capacity ${json.capacity ?? 'unlimited'}, gate word ${json.gateWord ?? 'not set'}.` });
      load(eventId, true);
    } catch (e) {
      setToast({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function checkIn(g: Guest, undo = false) {
    try {
      const res = await fetch('/api/pitlane/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: g.id, undo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Check-in failed (${res.status})`);
      setToast({
        ok: true,
        text: undo ? `Check-in undone for Nº ${pad(g.pass_number)}.` : `Checked in Nº ${pad(g.pass_number)}: ${g.first_name} ${g.last_name}, party of ${g.party_size}.`,
      });
      load(eventId, true);
    } catch (e) {
      setToast({ ok: false, text: (e as Error).message });
    }
  }

  async function reminders() {
    if (!eventId) return;
    setToast({ ok: true, text: 'Sending reminders…' });
    try {
      const res = await fetch('/api/pitlane/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Reminders failed (${res.status})`);
      setToast({ ok: true, text: json.sent ? `Reminder sent to ${json.sent} guests.` : 'Everyone already has a reminder.' });
    } catch (e) {
      setToast({ ok: false, text: (e as Error).message });
    }
  }

  const guests = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.rows ?? []).filter(
      (g) => !s || `${g.first_name} ${g.last_name} ${g.email} ${g.license_plate ?? ''} ${pad(g.pass_number)} ${g.pass_number}`.toLowerCase().includes(s),
    );
  }, [data, q]);

  const ev = data?.event;
  const st = data?.stats;

  return (
    <div className="text-white">
      <div className="mb-5">
        <div className={label}>Registrations</div>
        <h1 className="text-3xl font-bold uppercase">Guests by event</h1>
      </div>

      {toast && (
        <div role="status" className={`mb-4 flex justify-between gap-3 border px-3.5 py-2.5 font-mono text-xs ${toast.ok ? 'border-white' : 'border-white bg-white text-black'}`}>
          <span>{toast.ok ? 'DONE — ' : 'ERROR — '}{toast.text}</span>
          <button onClick={() => setToast(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {!loading && !data?.events.length && (
        <div className="border border-neutral-800 p-8 text-neutral-400">No events yet. Add one in the Events tab, then come back here to open registration.</div>
      )}

      {!!data?.events.length && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Every event, with its own headcount */}
          <aside className="min-w-0 border border-neutral-800">
            <div className={`${label} border-b border-neutral-800 px-4 py-3`}>Events</div>
            <ul>
              {data.events.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => load(e.id)}
                    className={`w-full border-b border-neutral-900 px-4 py-3.5 text-left ${e.id === eventId ? 'bg-white text-black' : 'hover:bg-neutral-950'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold uppercase">{e.title}</span>
                      <span className={`flex-none border px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.12em] ${e.id === eventId ? 'border-black' : e.registrationOpen ? 'border-white' : 'border-neutral-700 text-neutral-500'}`}>
                        {e.registrationOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>
                    <div className={`mt-1 flex justify-between font-mono text-[11px] tabular-nums ${e.id === eventId ? 'text-neutral-700' : 'text-neutral-400'}`}>
                      <span>{shortDate(e.dateISO)}</span>
                      <span>{e.heads}{e.capacity ? ` / ${e.capacity}` : ''} heads</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {ev && st && (
            <section className="min-w-0">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className={label}>{shortDate(ev.dateISO)}</div>
                  <h2 className="text-2xl font-bold uppercase">{ev.title}</h2>
                </div>
                <a href={`/${ev.slug}`} target="_blank" rel="noreferrer" className="font-mono text-[11px] uppercase tracking-[0.14em] underline underline-offset-4">
                  tickets.theinvtl.com/{ev.slug} ↗
                </a>
              </div>

              <div className="grid grid-cols-2 border border-neutral-800 md:grid-cols-4">
                {[
                  ['Registered', st.passes, 'passes'],
                  ['Total heads', st.heads, ev.capacity ? `of ${ev.capacity}` : 'no limit'],
                  ['Checked in', st.checkedInHeads, `${Math.round((st.checkedInHeads / Math.max(1, st.heads)) * 100)}% of heads`],
                  ['Cancelled', st.cancelled, 'spots freed'],
                ].map(([k, n, s], i) => (
                  <div key={k as string} className={`p-4 ${i % 2 === 0 ? 'border-r' : 'md:border-r'} ${i < 2 ? 'border-b md:border-b-0' : ''} border-neutral-800 last:border-r-0`}>
                    <div className={label}>{k}</div>
                    <div className="mt-1.5 font-mono text-[34px] font-medium leading-tight tabular-nums">{n}</div>
                    <div className="font-mono text-[11px] text-neutral-400">{s}</div>
                  </div>
                ))}
              </div>

              <div className="my-5 grid items-end gap-4 border border-neutral-800 p-4 sm:grid-cols-2 xl:grid-cols-[auto_1fr_1fr_auto]">
                <div className="flex flex-col gap-1.5">
                  <span className={label}>Registration</span>
                  <div className="flex border border-neutral-600">
                    {[true, false].map((v) => (
                      <button key={String(v)} aria-pressed={open === v} onClick={() => setOpen(v)} className={`px-3.5 py-2 font-mono text-[11.5px] tracking-[0.12em] ${open === v ? 'bg-white text-black' : 'text-neutral-400'}`}>
                        {v ? 'OPEN' : 'CLOSED'}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className={label}>Capacity (heads, blank = no limit)</span>
                  <input value={cap} onChange={(e) => setCap(e.target.value)} inputMode="numeric" className="rounded-none border border-neutral-600 bg-transparent px-3 py-2 font-mono text-sm" />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className={label}>Gate word (shows on passes on show day)</span>
                  <input value={gate} onChange={(e) => setGate(e.target.value.toUpperCase())} maxLength={16} className="rounded-none border border-neutral-600 bg-transparent px-3 py-2 font-mono text-sm uppercase" />
                </label>
                <button onClick={save} disabled={saving} className="bg-white px-4 py-2.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>

              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, plate or pass Nº" aria-label="Search guests" className="w-full max-w-xs rounded-none border border-neutral-600 bg-transparent px-3 py-2 font-mono text-sm" />
                <div className="flex gap-2">
                  <button onClick={reminders} className="border border-neutral-600 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] hover:border-white">Send day-before reminder</button>
                  <a href={`/api/pitlane/export?event=${ev.id}`} className="border border-neutral-600 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] hover:border-white">Export CSV</a>
                </div>
              </div>

              <div className="overflow-x-auto border border-neutral-800">
                <table className="w-full min-w-[820px] border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      {['Nº', 'Name', 'Email', 'Plate', 'Party', 'Registered', 'Status', ''].map((h) => (
                        <th key={h} className={`${label} px-3.5 py-3 text-left font-medium`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((g) => (
                      <tr key={g.id} className="border-b border-neutral-900 last:border-0">
                        <td className="px-3.5 py-3 font-mono text-[13px] tabular-nums">{pad(g.pass_number)}</td>
                        <td className="px-3.5 py-3 text-sm">{g.first_name} {g.last_name}</td>
                        <td className="px-3.5 py-3 font-mono text-[13px]">{g.email}</td>
                        <td className="px-3.5 py-3 font-mono text-[13px] tracking-[0.08em]">{g.license_plate ?? '—'}</td>
                        <td className="px-3.5 py-3 font-mono text-[13px]">{g.party_size}</td>
                        <td className="px-3.5 py-3 font-mono text-[13px]">{new Date(g.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                        <td className="px-3.5 py-3">
                          <span className={`whitespace-nowrap border px-2 py-1 font-mono text-[10.5px] tracking-[0.12em] ${g.status === 'checked_in' ? 'border-white bg-white text-black' : g.status === 'cancelled' ? 'border-neutral-800 text-neutral-500 line-through' : 'border-neutral-600'}`}>
                            {g.status === 'checked_in' ? 'CHECKED IN' : g.status === 'cancelled' ? 'CANCELLED' : 'VALID'}
                          </span>
                        </td>
                        <td className="px-3.5 py-3">
                          {g.status === 'valid' && <button onClick={() => checkIn(g)} className="border border-white px-2.5 py-1.5 font-mono text-[10.5px] tracking-[0.12em]">CHECK IN</button>}
                          {g.status === 'checked_in' && <button onClick={() => checkIn(g, true)} className="border border-neutral-700 px-2.5 py-1.5 font-mono text-[10.5px] tracking-[0.12em] text-neutral-400">UNDO</button>}
                        </td>
                      </tr>
                    ))}
                    {!guests.length && (
                      <tr><td colSpan={8} className="px-3.5 py-6 text-sm text-neutral-400">{q ? `No guests match “${q}”.` : 'No one has registered for this event yet.'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
