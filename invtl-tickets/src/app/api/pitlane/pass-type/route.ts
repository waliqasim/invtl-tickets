// POST { id, type: 'vip' | 'spectator' } → upgrade a guest to VIP (neon blue pass) or back to spectator.
import { NextResponse } from 'next/server';
import { adminDb, currentAdmin } from '@/lib/registrations/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: 'Your Pitlane session has expired. Sign in again.' }, { status: 401 });
  }
  const { id, type } = (await req.json().catch(() => ({}))) as { id?: string; type?: string };
  if (!id) return NextResponse.json({ error: 'Missing guest.' }, { status: 400 });
  if (type !== 'vip' && type !== 'spectator') return NextResponse.json({ error: 'Type must be VIP or spectator.' }, { status: 400 });

  const { data, error } = await adminDb().from('registrations').update({ pass_type: type }).eq('id', id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: `Couldn't change the pass: ${error.message}` }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'That pass no longer exists.' }, { status: 404 });
  return NextResponse.json({ ok: true, row: data });
}
