'use client';

import { useRouter } from 'next/navigation';
import { browserDb } from '@/lib/supabase-browser';

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await browserDb().auth.signOut();
        router.replace('/pitlane/login');
        router.refresh();
      }}
      className="border border-neutral-600 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] hover:border-white"
    >
      Sign out
    </button>
  );
}
