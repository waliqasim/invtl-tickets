import { NextResponse } from 'next/server';
import { adminDb, currentAdmin } from '@/lib/registrations/server';

export const dynamic = 'force-dynamic';

// POST { id, undo?: boolean }  → marks a guest checked in (or undoes it)
export async function POST(req: Request) {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: 'Your Pitlane session has expired. Sign in again.' }, { status: 401 });
  }
  const { id, undo } = (await req.json().catch(() => ({}))) as { id?: string; undo?: boolean };
  if (!id) return NextResponse.json({ error: 'Missing guest.' }, { status: 400 });

  const { data, error } = await adminDb()
    .from('registrations')
    .update(undo ? { status: 'valid', checked_in_at: null } : { status: 'checked_in', checked_in_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', undo ? 'checked_in' : 'valid')
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: `Check-in failed: ${error.message}` }, { status: 500 });
  if (!data) {
    return NextResponse.json(
      { error: undo ? 'This guest is not checked in.' : 'This guest is already checked in or their pass was cancelled.' },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, row: data });
}
