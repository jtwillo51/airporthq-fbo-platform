import { getBusinessDirectory } from "@/lib/data";
import FilterablePartners from "./FilterablePartners";

export const metadata = { title: "Local Businesses | Ridgeline Aviation" };

export default async function PartnersPage() {
  const dir = await getBusinessDirectory();

  return (
    <div className="px-6 py-[70px]">
      <div className="mx-auto max-w-[1200px]">
        {dir.isMockData && (
          <div
            className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: "rgba(217,170,62,0.12)", border: "1px solid rgba(217,170,62,0.3)", color: "var(--color-accent)" }}
          >
            &#9679; Example listings &mdash; not real businesses, for demo purposes
          </div>
        )}
        <h1 className="font-display text-[32px] font-bold">Businesses on the Field</h1>
        <p className="mt-2.5 max-w-[560px] text-[15px]" style={{ color: "var(--color-muted)" }}>
          Flight schools, detailers, and other operators based at KXRG &mdash; a directory
          AirportHQ can host for the whole airport, not just the FBO.
        </p>

        <FilterablePartners listings={dir.listings} />
      </div>
    </div>
  );
}
