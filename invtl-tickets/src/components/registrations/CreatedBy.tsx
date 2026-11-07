// Small credit line: "Created for INVTL by [TorqTechnologies logo]"
// Logo file: public/torq-technologies.png (white on transparent).
export default function CreatedBy({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-neutral-500 ${className}`}>
      Created for INVTL by
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/torq-technologies.png" alt="TorqTechnologies" className="h-[14px] w-auto opacity-80" />
    </span>
  );
}
