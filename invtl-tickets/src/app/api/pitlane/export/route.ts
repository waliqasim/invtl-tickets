import { adminDb, currentAdmin, getEventById, padNo } from '@/lib/registrations/server';

export const dynamic = 'force-dynamic';

// GET /api/pitlane/export?event=<id>  → CSV download
export async function GET(req: Request) {
  if (!(await currentAdmin())) return new Response('Sign in to Pitlane first.', { status: 401 });
  const id = new URL(req.url).searchParams.get('event') ?? '';
  const ev = await getEventById(id);
  if (!ev) return new Response('Event not found.', { status: 404 });

  const { data, error } = await adminDb()
    .from('registrations')
    .select('*')
    .eq('event_id', ev.id)
    .order('pass_number');
  if (error) return new Response(`Export failed: ${error.message}`, { status: 500 });

  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['pass_number', 'first_name', 'last_name', 'email', 'party_size', 'status', 'registered_at', 'checked_in_at'];
  const lines = [
    header.join(','),
    ...data.map((r) =>
      [padNo(r.pass_number), r.first_name, r.last_name, r.email, r.party_size, r.status, r.created_at, r.checked_in_at]
        .map(cell)
        .join(','),
    ),
  ];
  const name = `invtl-${ev.slug}-registrations.csv`.replace(/[^a-z0-9.-]+/gi, '-');
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  });
}
