// tickets.theinvtl.com → choose how you're coming: spectator ticket or showcase car.
import Link from 'next/link';
import CreatedBy from '@/components/registrations/CreatedBy';

export const metadata = {
  title: 'Register | INVTL',
  description: 'Get a free spectator ticket or register your car for an INVTL show.',
};

const OPTIONS = [
  {
    href: '/spectator',
    eyebrow: '01 — Spectator',
    title: 'Get a ticket',
    body: 'Free entry to the show as a guest. Claim your pass and show it on your phone at the gate.',
    cta: 'Claim a free ticket',
  },
  {
    href: '/showcase',
    eyebrow: '02 — Showcase',
    title: 'Show your car',
    body: 'Apply to put your car on display. We review every car and reach out if you’re confirmed.',
    cta: 'Register your car',
  },
];

export default function ChoosePage() {
  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <a href="https://theinvtl.com" className="font-sans text-xl font-bold tracking-[0.32em]">INVTL</a>
        <a href="https://theinvtl.com" className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-75 hover:opacity-100">Back to site</a>
      </header>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 md:pt-14">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400">Register</p>
        <h1 className="mb-8 mt-2 text-[clamp(36px,7vw,64px)] font-bold uppercase leading-[0.95] md:mb-12">How are you coming?</h1>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {OPTIONS.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className="group flex min-h-[260px] flex-col justify-between border border-neutral-700 p-6 transition-colors hover:border-white hover:bg-white hover:text-black md:min-h-[340px] md:p-8"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-400 group-hover:text-neutral-600">{o.eyebrow}</p>
              <div>
                <h2 className="text-[clamp(32px,5vw,52px)] font-bold uppercase leading-none">{o.title}</h2>
                <p className="mt-3 max-w-sm text-neutral-400 group-hover:text-neutral-700">{o.body}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {o.cta} <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-6"><CreatedBy /></div>
      </footer>
    </main>
  );
}
