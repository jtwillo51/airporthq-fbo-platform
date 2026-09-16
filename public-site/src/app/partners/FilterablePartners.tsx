"use client";

import { useState } from "react";
import type { BusinessDirectory } from "@/lib/data";

export default function FilterablePartners({ listings }: { listings: BusinessDirectory["listings"] }) {
  const categories = ["All", ...Array.from(new Set(listings.map((l) => l.category)))];
  const [active, setActive] = useState("All");
  const visible = listings.filter((l) => l.active && (active === "All" || l.category === active));

  return (
    <div>
      <div className="mt-7 flex flex-wrap gap-2.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className="rounded-full px-4 py-2 text-[13px] font-semibold"
            style={
              active === c
                ? { background: "var(--color-accent)", color: "var(--color-primary-dark)" }
                : { background: "rgba(120,120,120,0.1)", color: "var(--color-ink)" }
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((l) => (
          <div key={l.name} className="rounded-[20px] border bg-white p-6" style={{ borderColor: "var(--color-line)" }}>
            <div
              className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em]"
              style={{ color: "var(--color-accent)" }}
            >
              {l.category}
            </div>
            <h3 className="font-display text-[17px] font-semibold">{l.name}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
              {l.description}
            </p>
            <div
              className="mt-3.5 pt-3 text-[12.5px]"
              style={{ borderTop: "1px solid var(--color-line)", color: "var(--color-muted)" }}
            >
              {l.contact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
