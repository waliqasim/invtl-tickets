// GET /api/headcount?event=<id> → live number of people registered (used by the counter on each show page)
import { NextResponse } from 'next/server';
import { getEventById, headcount } from '@/lib/registrations/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('event') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Missing event.' }, { status: 400 });
  const ev = await getEventById(id);
  if (!ev) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  const { heads } = await headcount(ev.id);
  return NextResponse.json(
    { heads, capacity: ev.capacity },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
