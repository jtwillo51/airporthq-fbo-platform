export const metadata = { title: "Aircraft Maintenance | Ridgeline Aviation" };

const STAFF = [
  { name: "Example Mechanic", role: "A&P/IA · Lead Mechanic" },
  { name: "Example Mechanic", role: "A&P · Maintenance" },
];

export default function MaintenancePage() {
  return (
    <div className="px-6 py-[70px]">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="font-display text-[32px] font-bold">Aircraft Maintenance</h1>
        <p className="mt-2.5 max-w-[500px] text-[15px]" style={{ color: "var(--color-muted)" }}>
          Single and twin engine specialists &mdash; annual inspections, engine overhauls,
          restorations.
        </p>
        <p
          className="mt-3 inline-block rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]"
          style={{ background: "rgba(217,170,62,0.12)", color: "var(--color-accent)" }}
        >
          Placeholder staff listing &mdash; real names pending from the client
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {STAFF.map((s, i) => (
            <div key={i} className="rounded-[20px] border bg-white p-6" style={{ borderColor: "var(--color-line)" }}>
              <strong>{s.name}</strong>
              <div className="mt-1 text-[13px]" style={{ color: "var(--color-muted)" }}>
                {s.role}
              </div>
            </div>
          ))}
          <div className="rounded-[20px] border bg-white p-6" style={{ borderColor: "var(--color-line)" }}>
            <strong>Supported airframes</strong>
            <div className="mt-1 text-[13px]" style={{ color: "var(--color-muted)" }}>
              Cessna &middot; Cirrus &middot; Mooney &amp; more
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
