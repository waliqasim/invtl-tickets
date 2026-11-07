import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-white">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-neutral-400">404</div>
      <h1 className="mb-3 mt-2 text-4xl font-bold uppercase">Not found</h1>
      <p className="mb-6 max-w-md text-neutral-400">That show or pass doesn&apos;t exist. Check the link, or see which shows are open.</p>
      <Link href="/" className="bg-white px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black">See open shows</Link>
    </main>
  );
}
