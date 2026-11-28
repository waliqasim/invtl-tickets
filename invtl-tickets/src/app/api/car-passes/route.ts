// Called by the INVTL Pitlane (theinvtl.com) whenever a car is accepted, declined or (un)featured.
// Accepted car → red Featured pass (if ★ Featured) or yellow Main showcase pass, emailed to the owner.
// No longer accepted → the car pass is cancelled.
import { NextResponse } from 'next/server';
import { adminDb, getEventById, isAllowedAdmin, padNo, siteUrl, type Registration } from '@/lib/registrations/server';
import { sendPassEmail } from '@/lib/registrations/email';

export const dynamic = 'force-dynamic';

const ALLOWED_ORIGINS = ['https://theinvtl.com', 'https://www.theinvtl.com'];

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req) });
}

export async function POST(req: Request) {
  const headers = cors(req);
  const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers });
  const db = adminDb();

  // Only signed-in INVTL Pitlane admins
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer /i, '');
  if (!token) return reply({ error: 'Sign in to Pitlane again.' }, 401);
  const { data: who } = await db.auth.getUser(token);
  const user = who.user;
  if (!user) return reply({ error: 'Your Pitlane session has expired. Sign in again.' }, 401);
  const { data: adminRow } = await db.from('admins').select('id').eq('id', user.id).maybeSingle();
  if (!adminRow && !(user.email && isAllowedAdmin(user.email))) return reply({ error: 'This account is not a Pitlane admin.' }, 403);

  const { submissionId } = (await req.json().catch(() => ({}))) as { submissionId?: string };
  if (!submissionId) return reply({ error: 'Missing car.' }, 400);

  const { data: sub, error: subErr } = await db.from('vehicle_submissions').select('*').eq('id', submissionId).maybeSingle();
  if (subErr) return reply({ error: `Couldn't load the car: ${subErr.message}` }, 500);
  if (!sub) return reply({ error: 'That car no longer exists.' }, 404);

  // Not accepted (declined / back to pending) → cancel its car pass, if any
  if (sub.status !== 'accepted') {
    if (sub.pass_registration_id) {
      await db
        .from('registrations')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', sub.pass_registration_id)
        .in('pass_type', ['featured', 'showcase']);
    }
    return reply({ ok: true, pass: null, cancelled: !!sub.pass_registration_id });
  }

  const type = sub.featured ? 'featured' : 'showcase';
  const parts = String(sub.owner_name ?? '').trim().split(' ').filter(Boolean);
  const first = parts.shift() || 'Guest';
  const last = parts.join(' ');

  let before: Registration | null = null;
  if (sub.pass_registration_id) {
    const { data } = await db.from('registrations').select('*').eq('id', sub.pass_registration_id).maybeSingle();
    before = (data as Registration) ?? null;
  }

  const { data: issued, error } = await db.rpc('issue_pass', {
    p_event_id: sub.event_id,
    p_first: first.slice(0, 60),
    p_last: last.slice(0, 60),
    p_email: String(sub.email ?? '').toLowerCase(),
    p_plate: sub.license_plate ?? null,
    p_type: type,
  });
  if (error) return reply({ error: `Couldn't create the pass: ${error.message}` }, 500);
  const reg = issued as Registration;

  if (sub.pass_registration_id !== reg.id) {
    await db.from('vehicle_submissions').update({ pass_registration_id: reg.id }).eq('id', sub.id);
  }

  // Email the pass when it's new, was cancelled, or changed color
  let emailed = false;
  const changed = !before || before.status === 'cancelled' || before.pass_type !== reg.pass_type;
  if (changed) {
    const ev = await getEventById(reg.event_id);
    if (ev) {
      const mail = await sendPassEmail('confirm', reg, ev);
      emailed = mail.ok;
      if (!mail.ok) console.error(mail.error);
    }
  }

  return reply({
    ok: true,
    emailed,
    pass: { id: reg.id, type: reg.pass_type, number: padNo(reg.pass_number), url: `${siteUrl()}/pass/${reg.pass_code}` },
  });
}
