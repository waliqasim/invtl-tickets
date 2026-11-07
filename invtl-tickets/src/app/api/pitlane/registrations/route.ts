import { NextResponse } from 'next/server';
import { adminDb, currentAdmin, headcount, toEventView } from '@/lib/registrations/server';

export const dynamic = 'force-dynamic';

const deny = () => NextResponse.json({ error: 'Your Pitlane session has expired. Sign in again.' }, { status: 401 });

// GET /api/pitlane/registrations?event=<id>  → events list, settings, stats, guest list
export async function GET(req: Request) {
  if (!(await currentAdmin())) return deny();
  const db = adminDb();
  const eventParam = new URL(req.url).searchParams.get('event');

  const { data: evRows, error: evErr } = await db.from('events').select('*');
  if (evErr) return NextResponse.json({ error: `Couldn't load events: ${evErr.message}` }, { status: 500 });
  const events = (evRows ?? [])
    .map(toEventView)
    .sort((a, b) => String(b.dateISO ?? '').localeCompare(String(a.dateISO ?? '')));
  const ev = events.find((e) => e.id === eventParam) ?? events[0];
  if (!ev) return NextResponse.json({ events: [], event: null, rows: [], stats: null });

  const { data: rows, error } = await db
    .from('registrations')
    .select('*')
    .eq('event_id', ev.id)
    .order('pass_number', { ascending: false });
  if (error) return NextResponse.json({ error: `Couldn't load registrations: ${error.message}` }, { status: 500 });

  const hc = await headcount(ev.id);
  const checkedInHeads = rows.filter((r) => r.status === 'checked_in').reduce((a, r) => a + r.party_size, 0);

  // Headcount for every event, for the per-event list in Pitlane
  const { data: all } = await db.from('registrations').select('event_id, party_size, status').neq('status', 'cancelled');
  const per = new Map<string, { passes: number; heads: number }>();
  for (const r of all ?? []) {
    const p = per.get(r.event_id) ?? { passes: 0, heads: 0 };
    p.passes++;
    p.heads += r.party_size;
    per.set(r.event_id, p);
  }

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      dateISO: e.dateISO,
      registrationOpen: e.registrationOpen,
      capacity: e.capacity,
      passes: per.get(e.id)?.passes ?? 0,
      heads: per.get(e.id)?.heads ?? 0,
    })),
    event: ev,
    rows,
    stats: {
      passes: hc.passes,
      heads: hc.heads,
      checkedInHeads,
      cancelled: rows.filter((r) => r.status === 'cancelled').length,
    },
  });
}

// PATCH /api/pitlane/registrations  { eventId, registrationOpen, capacity, gateWord }
export async function PATCH(req: Request) {
  if (!(await currentAdmin())) return deny();
  const b = (await req.json().catch(() => ({}))) as {
    eventId?: string;
    registrationOpen?: boolean;
    capacity?: number | null;
    gateWord?: string;
  };
  if (!b.eventId) return NextResponse.json({ error: 'Pick an event first.' }, { status: 400 });

  const cap = b.capacity === null || b.capacity === undefined ? null : Number(b.capacity);
  if (cap !== null && (!Number.isInteger(cap) || cap < 1)) {
    return NextResponse.json({ error: 'Capacity must be a whole number, or blank for no limit.' }, { status: 400 });
  }
  if (cap !== null) {
    const hc = await headcount(b.eventId);
    if (cap < hc.heads) {
      return NextResponse.json({ error: `Capacity can't be lower than the ${hc.heads} heads already registered.` }, { status: 400 });
    }
  }
  const gate = (b.gateWord ?? '').trim().toUpperCase().slice(0, 16) || null;

  const { data, error } = await adminDb()
    .from('events')
    .update({ registration_open: !!b.registrationOpen, capacity: cap, gate_word: gate })
    .eq('id', b.eventId)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Save failed: event not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, gateWord: gate, capacity: cap });
}
