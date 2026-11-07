// "Spectator entry only" notice shown on the tickets pages.
export default function EntryNotice({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-white px-4 py-3.5 ${className}`}>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">Show entry only</p>
      <p className="mt-1.5 text-sm text-neutral-300">
        This free ticket gets you into the show as a guest. It does not register a car for display, and it does not
        include parking. Want to show your car? Apply at{' '}
        <a href="https://theinvtl.com" className="underline underline-offset-4 hover:text-white">theinvtl.com</a>.
      </p>
    </div>
  );
}
