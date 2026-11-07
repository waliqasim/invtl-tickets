// theinvtl.com/register (and tickets.theinvtl.com) → lists every event with registration open.
// If exactly one is open, guests go straight to it.
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminDb, formatShowDate, toEventView } from '@/lib/registrations/server';
import CreatedBy from '@/components/registrations/CreatedBy';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tickets | INVTL', description: 'Free registration for INVTL shows.' };

export default async function TicketsIndex() {
  const { data } = await adminDb().from('events').select('*').eq('registration_open', true);
  const events = (data ?? [])
    .map(toEventView)
    .sort((a, b) => String(a.dateISO ?? '').localeCompare(String(b.dateISO ?? '')));

  if (events.length === 1) redirect(`/${events[0].slug}`);

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <a href="https://theinvtl.com" className="font-sans text-xl font-bold tracking-[0.32em]">INVTL</a>
        <a href="https://theinvtl.com" className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-75 hover:opacity-100">Back to site</a>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400">Tickets</p>
        <h1 className="mb-8 mt-2 text-5xl font-bold uppercase">Free registration</h1>
        {events.length === 0 ? (
          <div className="border border-neutral-800 p-8 text-neutral-400">
            No shows are open for registration right now. Follow @theinvtl for the next invite.
          </div>
        ) : (
          <ul className="border-t border-neutral-800">
            {events.map((e) => {
              const d = formatShowDate(e.dateISO);
              return (
                <li key={e.id}>
                  <Link href={`/${e.slug}`} className="group flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 py-5">
                    <div className="min-w-0">
                      <div className="font-mono text-xs tracking-[0.08em] text-neutral-400">{d.short} {d.dots}{e.venue ? ` — ${e.venue.toUpperCase()}` : ''}</div>
                      <div className="mt-1 text-2xl font-bold uppercase">{e.title}</div>
                    </div>
                    <span className="bg-white px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black group-hover:bg-neutral-200">Register free →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <footer className="border-t border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-6"><CreatedBy /></div>
      </footer>
    </main>
  );
}
