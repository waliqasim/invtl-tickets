// tickets.theinvtl.com/showcase → register a car to be displayed at an upcoming show.
import { adminDb } from '@/lib/registrations/server';
import ShowcaseForm from '@/components/showcase/ShowcaseForm';
import CreatedBy from '@/components/registrations/CreatedBy';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const metadata = {
  title: 'Register Your Car | INVTL',
  description: 'Apply to put your car on display at an upcoming INVTL show.',
};

export default async function ShowcasePage() {
  const { data } = await adminDb()
    .from('events')
    .select('id, title, event_date')
    .eq('is_published', true)
    .eq('event_status', 'upcoming')
    .order('event_date', { ascending: true });

  const events = (data ?? []) as { id: string; title: string; event_date: string }[];

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <a href="https://theinvtl.com" className="font-sans text-xl font-bold tracking-[0.32em]">INVTL</a>
        <a href="https://theinvtl.com" className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-75 hover:opacity-100">Back to site</a>
      </header>

      <section className="mx-auto grid max-w-6xl gap-9 px-4 pb-16 pt-8 md:grid-cols-[1fr_1.15fr] md:gap-12 md:pt-14">
        <div className="min-w-0">
          <a href="/" className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400 hover:text-white">← Back</a>
          <h1 className="mb-5 mt-2 text-[clamp(36px,7vw,64px)] font-bold uppercase leading-[0.95]">Get your car on the list</h1>
          <p className="max-w-[46ch] text-neutral-400">
            Pick an upcoming show and tell us about your car. We review every submission before the show and reach out if
            you&apos;re confirmed.
          </p>
          <dl className="mt-8 border-t border-neutral-800">
            {[
              ['Standard', 'Free'],
              ['Featured', '$25, only if your car is selected'],
              ['Review', 'Every car is reviewed by the INVTL team'],
              ['Confirmation', 'By email or Instagram before the show'],
              ['Just watching?', 'Get a spectator ticket instead'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[120px_1fr] gap-3 border-b border-neutral-800 py-3.5">
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400">{k}</dt>
                <dd>{k === 'Just watching?' ? <a href="/spectator" className="underline underline-offset-4">{v}</a> : v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="min-w-0">
          <ShowcaseForm events={events} />
        </div>
      </section>

      <footer className="border-t border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-6"><CreatedBy /></div>
      </footer>
    </main>
  );
}
