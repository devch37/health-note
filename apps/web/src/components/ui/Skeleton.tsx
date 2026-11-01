export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-[var(--radius-control)] bg-[#e7ecef] ${className}`} />;
}
