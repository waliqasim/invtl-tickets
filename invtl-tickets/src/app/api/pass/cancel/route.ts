import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/registrations/server';

export const dynamic = 'force-dynamic';

// Guest cancels their own pass. The private pass code is the proof it's theirs.
export async function POST(req: Request) {
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code || !/^[a-z0-9]{8,32}$/i.test(code)) {
    return NextResponse.json({ error: 'That pass link is not valid.' }, { status: 400 });
  }
  const { data, error } = await adminDb()
    .from('registrations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('pass_code', code)
    .eq('status', 'valid')
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: "We couldn't cancel your pass. Try again." }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'This pass is already checked in or cancelled.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
