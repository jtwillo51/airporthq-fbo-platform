"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS: { title: string; links: { href: string; label: string; live?: boolean }[] }[] = [
  {
    title: "Overview",
    links: [{ href: "/", label: "Dashboard" }],
  },
  {
    title: "Fuel Operations",
    links: [
      { href: "/fuel", label: "Tank Logs", live: true },
      { href: "/trucks", label: "Trucks" },
    ],
  },
  {
    title: "Money",
    links: [
      { href: "/cash-box", label: "Cash Box", live: true },
      { href: "/landing-fees", label: "Landing Fees" },
      { href: "/hangar-settlements", label: "Hangar Settlements" },
      { href: "/purchases", label: "CC Purchases" },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/aircraft", label: "Aircraft Location" },
      { href: "/customers", label: "Customers" },
      { href: "/timesheet", label: "Timesheet" },
    ],
  },
  {
    title: "Reporting",
    links: [
      { href: "/reports", label: "Reports" },
      { href: "/profitability", label: "Profitability" },
    ],
  },
  {
    title: "Intelligence",
    links: [{ href: "/insights", label: "AI Insights", live: true }],
  },
  {
    title: "Content",
    links: [
      { href: "/site-content", label: "Public Site Content", live: true },
      { href: "/local-businesses", label: "Local Businesses", live: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hq-rail w-60 shrink-0">
      <div className="px-5 pb-5 pt-6">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-[1.05rem] font-semibold tracking-tight text-white">
            Airport<span className="text-[var(--color-accent)]">HQ</span>
          </span>
        </Link>
        <p className="mt-0.5 hq-eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>
          Ridgeline Aviation
        </p>
      </div>
      <nav className="px-3 pb-8">
        {SECTIONS.map((s) => (
          <div key={s.title} className="mb-5">
            <p className="hq-rail-heading">{s.title}</p>
            {s.links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href} className={`hq-rail-link ${active ? "hq-rail-link--active" : ""}`}>
                  <span>{l.label}</span>
                  {l.live && <span className="hq-dot hq-dot--amber" aria-hidden="true" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
