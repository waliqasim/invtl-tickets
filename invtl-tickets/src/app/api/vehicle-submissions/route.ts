// Saves a showcase car registration into the same list the INVTL Pitlane reviews.
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/registrations/server';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLATE_RE = /^[A-Z0-9][A-Z0-9 -]{0,8}[A-Z0-9]$/;
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "The form didn't send properly. Refresh and try again." }, { status: 400 });
  }
  if (clean(b.company, 100)) return NextResponse.json({ error: 'Submission failed.' }, { status: 400 });

  const row = {
    event_id: clean(b.event_id, 64),
    owner_name: clean(b.owner_name, 100),
    email: clean(b.email, 254).toLowerCase(),
    phone: clean(b.phone, 30) || null,
    instagram: clean(b.instagram, 60).replace(/^@/, '') || null,
    vehicle_year: clean(b.vehicle_year, 4) || null,
    vehicle_make: clean(b.vehicle_make, 60),
    vehicle_model: clean(b.vehicle_model, 60),
    license_plate: clean(b.license_plate, 10).toUpperCase(),
    vehicle_notes: clean(b.vehicle_notes, 1000) || null,
    photo_url: clean(b.photo_url, 500) || null,
  };

  if (!row.event_id) return NextResponse.json({ error: "Pick the show you're registering for." }, { status: 400 });
  if (!row.owner_name) return NextResponse.json({ error: "Add the owner's name." }, { status: 400 });
  if (!EMAIL_RE.test(row.email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  if (!row.vehicle_make || !row.vehicle_model) return NextResponse.json({ error: "Add the car's make and model." }, { status: 400 });
  if (!PLATE_RE.test(row.license_plate)) return NextResponse.json({ error: "Add the car's license plate (letters and numbers only)." }, { status: 400 });

  const { error } = await adminDb().from('vehicle_submissions').insert(row);
  if (error) {
    console.error('vehicle submission failed', error);
    return NextResponse.json({ error: `Couldn't save your car: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
