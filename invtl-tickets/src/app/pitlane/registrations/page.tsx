import { redirect } from 'next/navigation';
import RegistrationsManager from '@/components/pitlane/RegistrationsManager';
import SignOutButton from '@/components/pitlane/SignOutButton';
import { currentAdmin } from '@/lib/registrations/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Registrations | Pitlane', robots: { index: false, follow: false } };

export default async function PitlaneRegistrationsPage() {
  const admin = await currentAdmin();
  if (!admin) redirect('/pitlane/login');

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-4 md:px-8">
        <span className="font-mono text-xs tracking-[0.2em]">PITLANE · TICKETS</span>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[11px] text-neutral-400 sm:inline">{admin.email}</span>
          <SignOutButton />
        </div>
      </header>
      <div className="px-4 py-8 md:px-8">
        <RegistrationsManager />
      </div>
    </main>
  );
}
