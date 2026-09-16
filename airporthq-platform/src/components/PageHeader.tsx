export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-panel)] px-8 py-5">
      <h1 className="text-[1.05rem] font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">{subtitle}</p>}
    </div>
  );
}
