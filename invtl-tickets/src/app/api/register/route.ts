import { NextResponse } from 'next/server';
import { adminDb, getEventById, padNo, siteUrl, type Registration } from '@/lib/registrations/server';
import { sendPassEmail } from '@/lib/registrations/email';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Something went wrong sending the form. Refresh and try again.' }, { status: 400 });
  }

  // Honeypot field: real people never fill it in
  if (clean(body.company, 100)) return NextResponse.json({ error: 'Registration failed.' }, { status: 400 });

  const eventId = clean(body.eventId, 64);
  const first = clean(body.firstName, 60);
  const last = clean(body.lastName, 60);
  const email = clean(body.email, 254).toLowerCase();
  const party = Number(body.partySize);

  if (!first || !last) return NextResponse.json({ error: 'Add your first and last name.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "That email doesn't look right. Check it and try again." }, { status: 400 });
  if (!Number.isInteger(party) || party < 1 || party > 4) return NextResponse.json({ error: 'Party size must be 1 to 4.' }, { status: 400 });
  if (body.agreed !== true) return NextResponse.json({ error: 'Tick the box to agree to the meet rules.' }, { status: 400 });

  const ev = await getEventById(eventId);
  if (!ev) return NextResponse.json({ error: 'This event no longer exists.' }, { status: 404 });

  const db = adminDb();
  const { data: existing } = await db
    .from('registrations')
    .select('id')
    .eq('event_id', ev.id)
    .ilike('email', email)
    .neq('status', 'cancelled')
    .maybeSingle();

  const { data, error } = await db.rpc('claim_pass', {
    p_event_id: ev.id,
    p_first: first,
    p_last: last,
    p_email: email,
    p_party: party,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('REGISTRATION_CLOSED'))
      return NextResponse.json({ error: "Registration for this show is closed." , code: 'closed' }, { status: 409 });
    if (msg.includes('EVENT_FULL')) {
      const left = Number(msg.split('EVENT_FULL:')[1]) || 0;
      return NextResponse.json(
        { error: left > 0 ? `Only ${left} spot${left === 1 ? '' : 's'} left. Lower your party size.` : 'This show is full.', code: left > 0 ? 'short' : 'full' },
        { status: 409 },
      );
    }
    console.error('claim_pass failed', error);
    return NextResponse.json({ error: "We couldn't create your pass. Try again in a minute." }, { status: 500 });
  }

  const reg = data as Registration;
  const mail = await sendPassEmail('confirm', reg, ev);
  if (!mail.ok) console.error(mail.error);

  return NextResponse.json({
    passUrl: `${siteUrl()}/pass/${reg.pass_code}`,
    code: reg.pass_code,
    passNumber: padNo(reg.pass_number),
    alreadyRegistered: !!existing,
    emailSent: mail.ok,
  });
}
