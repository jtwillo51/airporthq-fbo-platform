import Link from "next/link";
import type { FuelPrices, SiteContent } from "@/lib/data";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Fueling" },
  { href: "/airport-info", label: "Airport Info" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/live", label: "Live Cam" },
  { href: "/partners", label: "Local Businesses" },
  { href: "/contact", label: "Contact" },
];

function formatHours(h: SiteContent["operatingHours"]) {
  const weekday = h.find((d) => d.day === "Monday");
  const saturday = h.find((d) => d.day === "Saturday");
  if (!weekday?.open || !weekday.close) return "See hours";
  const fmt = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    const period = hh >= 12 ? "pm" : "am";
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return mm ? `${h12}:${String(mm).padStart(2, "0")}${period}` : `${h12}${period}`;
  };
  let s = `Mon–Fri ${fmt(weekday.open)}–${fmt(weekday.close)}`;
  if (saturday?.open && saturday.close) {
    s += ` · Sat ${fmt(saturday.open)}–${fmt(saturday.close)}`;
  }
  return s;
}

export default function Nav({ site, prices }: { site: SiteContent; prices: FuelPrices }) {
  return (
    <>
      <header
        className="sticky top-0 z-30"
        style={{ background: "var(--color-nav-bg)", backdropFilter: "blur(20px)" }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-3 text-white">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold"
              style={{ border: "2px solid var(--color-accent)", color: "var(--color-accent)" }}
            >
              SV
            </span>
            <span className="leading-tight">
              <span
                className="block text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70"
              >
                Summit Jet Center
              </span>
              <span className="block font-display text-[18px] font-bold">Ridgeline Aviation</span>
            </span>
          </Link>
          <nav className="hidden flex-wrap gap-6 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border-b-2 border-transparent pb-1 text-[13px] font-medium uppercase tracking-[0.04em] text-white/85 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Persistent quick-reference strip — the facts a flight planner scans
          first, before any marketing copy, on every page. */}
      <div style={{ background: "var(--color-dark-panel)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-baseline gap-x-9 gap-y-2 px-6 py-3.5">
          <QRef label="Hours" value={formatHours(site.operatingHours)} />
          <QRef label="After-Hours" value={`Call-out, $${site.afterHoursFee.toFixed(0)} fee`} accent />
          <QRef label="Phone" value={site.phone} />
          <QRef label="100LL" value={`$${prices.avgas100LL.price.toFixed(2)}`} accent />
          <QRef label="Jet A" value={`$${prices.jetAFullServe.price.toFixed(2)}`} accent />
        </div>
      </div>
    </>
  );
}

function QRef({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "#7a8089" }}>
        {label}
      </span>
      <span
        className="numeral text-[13px] font-semibold"
        style={{ color: accent ? "var(--color-accent)" : "#fff" }}
      >
        {value}
      </span>
    </div>
  );
}
