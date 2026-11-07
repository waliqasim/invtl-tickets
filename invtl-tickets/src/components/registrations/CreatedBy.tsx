'use client';

// Footer line: "Created for INVTL by [TorqTechnologies logo] · Team login"
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CreatedBy({ className = '' }: { className?: string }) {
  const path = usePathname() ?? '';
  const onPitlane = path.startsWith('/pitlane');

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-neutral-500 ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        Created for INVTL by
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/torq-technologies.png" alt="TorqTechnologies" className="h-[14px] w-auto opacity-80" />
      </span>
      {!onPitlane && (
        <>
          <span aria-hidden>·</span>
          <Link href="/pitlane/login" className="underline-offset-4 hover:text-white hover:underline">
            Team login
          </Link>
        </>
      )}
    </span>
  );
}
