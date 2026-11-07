import { NextResponse } from 'next/server';
import { adminDb, currentAdmin, getEventById, type Registration } from '@/lib/registrations/server';
import { sendPassEmail } from '@/lib/registrations/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST { eventId } → emails the day-before reminder to every valid pass that hasn't had one.
// Manual button in Pitlane, so you choose when it goes out.
export async function POST(req: Request) {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: 'Your Pitlane session has expired. Sign in again.' }, { status: 401 });
  }
  const { eventId } = (await req.json().catch(() => ({}))) as { eventId?: string };
  const ev = eventId ? await getEventById(eventId) : null;
  if (!ev) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const db = adminDb();
  const { data, error } = await db
    .from('registrations')
    .select('*')
    .eq('event_id', ev.id)
    .eq('status', 'valid')
    .is('reminder_sent_at', null);
  if (error) return NextResponse.json({ error: `Couldn't load guests: ${error.message}` }, { status: 500 });

  let sent = 0;
  const failed: string[] = [];
  for (const r of data as Registration[]) {
    const res = await sendPassEmail('reminder', r, ev);
    if (res.ok) {
      sent++;
      await db.from('registrations').update({ reminder_sent_at: new Date().toISOString() }).eq('id', r.id);
    } else {
      failed.push(r.email);
    }
  }
  if (failed.length) {
    return NextResponse.json(
      { error: `Sent ${sent}, but ${failed.length} failed: ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? '…' : ''}`, sent },
      { status: 207 },
    );
  }
  return NextResponse.json({ ok: true, sent });
}
