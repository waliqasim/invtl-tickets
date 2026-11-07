import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatShowDate, getEventBySlug, headcount } from '@/lib/registrations/server';
import RegisterForm from '@/components/registrations/RegisterForm';
import CreatedBy from '@/components/registrations/CreatedBy';
import '@/components/registrations/passes.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const ev = await getEventBySlug(params.slug);
  if (!ev) return { title: 'INVTL' };
  return {
    title: `Register — ${ev.title} | INVTL`,
    description: `Free registration for ${ev.title}. Claim your pass and show it at the gate.`,
    openGraph: ev.image ? { images: [ev.image] } : undefined,
  };
}

export default async function RegisterPage({ params }: { params: { slug: string } }) {
  const ev = await getEventBySlug(params.slug);
  if (!ev) notFound();

  const { heads } = await headcount(ev.id);
  const d = formatShowDate(ev.dateISO);
  const full = ev.capacity !== null && heads >= ev.capacity;
  const left = ev.capacity !== null ? Math.max(0, ev.capacity - heads) : null;
  const stateLabel = !ev.registrationOpen ? 'Registration closed' : full ? 'Registration full' : 'Registration open';
  const ticker = 'FREE ENTRY — REGISTER TO ATTEND — LIMITED SPOTS — INVTL — SHOW YOUR PASS AT THE GATE — '.repeat(4);

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <a href="https://theinvtl.com" className="font-sans text-xl font-bold tracking-[0.32em]">INVTL</a>
        <a href="https://theinvtl.com" className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-75 hover:opacity-100">Back to site</a>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[440px] items-end overflow-hidden border-y border-neutral-800">
        {ev.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ev.image} alt="" className="invtl-kenburns absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/30 to-black/90" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-10">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-300">Invitational — {stateLabel}</p>
          <h1 className="mb-4 mt-3 max-w-4xl font-sans text-[clamp(40px,8vw,84px)] font-bold uppercase leading-[0.95]">{ev.title}</h1>
          <p className="font-mono text-[13px] tracking-[0.08em]">
            {d.short} {d.dots}
            {ev.timeLabel && ` — ${ev.timeLabel}`}
            {ev.venue && ` — ${ev.venue.toUpperCase()}`}
          </p>
        </div>
      </section>

      {/* Ticker */}
      <div className="overflow-hidden bg-white text-black" aria-hidden>
        <div className="invtl-ticker">
          {[0, 1].map((i) => (
            <span key={i} className="whitespace-nowrap py-2.5 font-mono text-xs font-semibold tracking-[0.2em]">{ticker}</span>
          ))}
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-9 px-4 py-9 md:grid-cols-[1fr_1.15fr] md:gap-12 md:py-14">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400">Registered</p>
          <p className="font-mono">
            <span className="text-[clamp(48px,7vw,72px)] font-medium leading-none tabular-nums">{heads}</span>
            {ev.capacity !== null && <span className="text-lg text-neutral-400"> / {ev.capacity}</span>}
          </p>
          {ev.capacity !== null && (
            <>
              <div className="relative mb-2.5 mt-4 h-0.5 bg-neutral-800">
                <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${Math.min(100, (heads / ev.capacity) * 100)}%` }} />
              </div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400">{left} spots left</p>
            </>
          )}
          <dl className="mt-9 border-t border-neutral-800">
            {[
              ['Entry', 'Free. Registration required.'],
              ['Date', d.long],
              ['Time', ev.timeLabel || 'See your pass'],
              ['Venue', ev.venue || 'Shared on your pass'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_1fr] gap-3 border-b border-neutral-800 py-3.5">
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-7 max-w-[46ch] text-sm text-neutral-400">
            Claim your pass, save it to your home screen, and show it on your phone at the gate. Screenshots aren&apos;t accepted.
          </p>
        </div>

        <div className="min-w-0">
          {!ev.registrationOpen || full ? (
            <div className="border border-neutral-800 px-7 py-10 text-center">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400">{!ev.registrationOpen ? 'Closed' : 'Full'}</p>
              <h2 className="mb-2.5 mt-2 text-3xl font-bold uppercase">{stateLabel}</h2>
              <p className="text-neutral-400">
                {!ev.registrationOpen ? "Registration for this show isn't open right now." : 'Every spot for this show is taken.'} Follow @theinvtl for the next invite.
              </p>
            </div>
          ) : (
            <RegisterForm eventId={ev.id} spotsLeft={left} />
          )}
        </div>
      </section>

      <footer className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-6 font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400">
          <span>© INVTL</span>
          <span>@theinvtl · theinvtl.com</span>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-6">
          <CreatedBy />
        </div>
      </footer>
    </main>
  );
}
