export default function Flag({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex gap-2.5 rounded-[var(--radius-sm)] border border-[color:var(--color-danger)]/25 bg-[color:var(--color-danger)]/[0.06] px-3.5 py-2.5 text-sm leading-snug text-[color:var(--color-text)]">
      <span className="mt-1 hq-dot hq-dot--danger shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
