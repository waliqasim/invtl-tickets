import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { adminDb, formatShowDate, getEventById, isShowDay, padNo, type Registration } from '@/lib/registrations/server';
import PassCard from '@/components/registrations/PassCard';
import '@/components/registrations/passes.css';

export const dynamic = 'force-dynamic';

// Private link: keep passes out of search engines
export function generateMetadata({ params }: { params: { code: string } }): Metadata {
  return {
    title: 'Your INVTL Pass',
    robots: { index: false, follow: false },
    manifest: `/pass/${params.code}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: 'INVTL Pass', statusBarStyle: 'black' },
  };
}
export const viewport: Viewport = { themeColor: '#000000' };

export default async function PassPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { existing?: string };
}) {
  if (!/^[a-z0-9]{8,32}$/i.test(params.code)) notFound();

  const { data } = await adminDb().from('registrations').select('*').eq('pass_code', params.code).maybeSingle();
  if (!data) notFound();
  const r = data as Registration;
  const ev = await getEventById(r.event_id);
  if (!ev) notFound();

  const d = formatShowDate(ev.dateISO);

  return (
    <main className="min-h-screen bg-black text-white">
      <PassCard
        code={r.pass_code}
        number={padNo(r.pass_number)}
        name={`${r.first_name} ${r.last_name}`}
        party={r.party_size}
        status={r.status}
        eventTitle={ev.title}
        dateDots={d.dots}
        timeLabel={ev.timeLabel}
        venue={ev.venue}
        image={ev.image}
        gateWord={isShowDay(ev.dateISO) ? ev.gateWord : null}
        existing={searchParams.existing === '1'}
      />
    </main>
  );
}
