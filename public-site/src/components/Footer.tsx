import type { SiteContent } from "@/lib/data";

export default function Footer({ site }: { site: SiteContent }) {
  return (
    <footer style={{ background: "var(--color-footer)", color: "rgba(255,255,255,0.5)" }} className="px-6 py-12 text-[13px]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
        <div>{site.facilityName} &middot; Ridgeline Regional ({site.airportCode})</div>
        <a href={`tel:${site.phone.replace(/[^0-9]/g, "")}`} className="numeral text-white">
          {site.phone}
        </a>
      </div>
    </footer>
  );
}
