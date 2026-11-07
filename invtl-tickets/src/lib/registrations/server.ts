// Server-only helpers for INVTL registrations. Never import this from a client component.
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type RegStatus = 'valid' | 'checked_in' | 'cancelled';

export type Registration = {
  id: string;
  event_id: string;
  pass_number: number;
  pass_code: string;
  first_name: string;
  last_name: string;
  email: string;
  party_size: number;
  status: RegStatus;
  checked_in_at: string | null;
  cancelled_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
};

export type EventView = {
  id: string;
  slug: string;
  title: string;
  dateISO: string | null;
  timeLabel: string;
  venue: string;
  image: string | null;
  registrationOpen: boolean;
  capacity: number | null;
  gateWord: string | null;
};

// Service-role client. Bypasses RLS, so it only ever runs on the server.
export function adminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Returns the signed-in Pitlane admin, or null. Uses the same cookie session as the rest of Pitlane.
export async function currentAdmin() {
  const store = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: () => {
          /* read-only here */
        },
      },
    },
  );
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user?.email) return null;
  return isAllowedAdmin(user.email) ? user : null;
}

// Only these emails can use Pitlane here. Set PITLANE_ADMIN_EMAILS in Netlify as a comma-separated list.
export function isAllowedAdmin(email: string) {
  const list = (process.env.PITLANE_ADMIN_EMAILS ?? 'wali@theinvtl.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

// Maps whatever the existing events table calls its columns onto one shape.
// Adjust the fallbacks here if your column names differ.
export function toEventView(e: Record<string, any>): EventView {
  const dateISO = e.date ?? e.event_date ?? e.starts_at ?? null;
  return {
    id: e.id,
    slug: e.slug ?? e.id,
    title: e.title ?? e.name ?? 'INVTL',
    dateISO,
    timeLabel: e.time ?? e.time_label ?? '',
    venue: e.venue ?? e.location ?? '',
    image: e.image_url ?? e.cover_image_url ?? e.hero_image_url ?? e.image ?? null,
    registrationOpen: !!e.registration_open,
    capacity: e.capacity ?? null,
    gateWord: e.gate_word ?? null,
  };
}

export async function getEventBySlug(slug: string): Promise<EventView | null> {
  const db = adminDb();
  let { data } = await db.from('events').select('*').eq('slug', slug).maybeSingle();
  if (!data && /^[0-9a-f-]{36}$/i.test(slug)) {
    ({ data } = await db.from('events').select('*').eq('id', slug).maybeSingle());
  }
  return data ? toEventView(data) : null;
}

export async function getEventById(id: string): Promise<EventView | null> {
  const { data } = await adminDb().from('events').select('*').eq('id', id).maybeSingle();
  return data ? toEventView(data) : null;
}

export async function headcount(eventId: string): Promise<{ passes: number; heads: number }> {
  const { data, error } = await adminDb()
    .from('registrations')
    .select('party_size')
    .eq('event_id', eventId)
    .neq('status', 'cancelled');
  if (error) throw error;
  return {
    passes: data.length,
    heads: data.reduce((a, r: { party_size: number }) => a + r.party_size, 0),
  };
}

export const padNo = (n: number) => String(n).padStart(3, '0');

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tickets.theinvtl.com').replace(/\/$/, '');
}

// "Is today the show day?" in Atlanta time. The gate word only shows on that day.
export function isShowDay(dateISO: string | null, now = new Date()) {
  if (!dateISO) return false;
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const showDay = /^\d{4}-\d{2}-\d{2}$/.test(dateISO) ? dateISO : fmt(new Date(dateISO));
  return fmt(now) === showDay;
}

export function formatShowDate(dateISO: string | null) {
  if (!dateISO) return { long: 'Date to be announced', short: 'TBA', dots: 'TBA' };
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateISO) ? new Date(dateISO + 'T12:00:00') : new Date(dateISO);
  const tz = 'America/New_York';
  return {
    long: d.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    short: d.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' }).toUpperCase(),
    dots: d
      .toLocaleDateString('en-US', { timeZone: tz, month: '2-digit', day: '2-digit', year: '2-digit' })
      .replace(/\//g, '.'),
  };
}
