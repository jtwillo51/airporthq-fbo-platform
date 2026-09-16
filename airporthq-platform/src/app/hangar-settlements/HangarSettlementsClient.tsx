"use client";

import Flag from "@/components/Flag";
import MonthSearchBar from "@/components/MonthSearchBar";
import { useMonthSearch } from "@/lib/useMonthSearch";
import type { HangarSettlement } from "@/lib/data";

const SEARCH_KEYS = ["hangar", "tailNumber", "aircraftType", "owner.name"];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-sans text-[color:var(--color-text-muted)]">{label}</p>
      <p>{value}</p>
    </div>
  );
}

export default function HangarSettlementsClient({ settlements }: { settlements: HangarSettlement[] }) {
  const filter = useMonthSearch<HangarSettlement>({
    rows: settlements,
    dateKey: "arrivalDate",
    searchKeys: SEARCH_KEYS,
  });

  return (
    <>
      <MonthSearchBar
        month={filter.month}
        onMonthChange={filter.setMonth}
        monthsPresent={filter.monthsPresent}
        query={filter.query}
        onQueryChange={filter.setQuery}
        allHistory={filter.allHistory}
        onAllHistoryChange={filter.setAllHistory}
        resultCount={filter.result.length}
        searchPlaceholder="Search hangar, tail number, owner…"
      />
      <div className="space-y-6">
        {filter.result.map((s, i) => (
          <div key={i} className="hq-card p-6">
            {s.dataQualityFlag && <Flag>{s.dataQualityFlag}</Flag>}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">
                Hangar {s.hangar} &mdash; {s.aircraftType} ({s.tailNumber})
              </h2>
              <span className="font-mono text-sm text-[color:var(--color-text-muted)]">
                {s.arrivalDate} &rarr; {s.departureDate} ({s.nights} nights)
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-y-2 font-mono text-sm sm:grid-cols-4">
              <Field label="Nightly rate" value={`$${s.nightlyRate}`} />
              <Field label="Gross rent" value={`$${s.grossRent}`} />
              <Field label="Sales tax (5%)" value={`$${s.salesTax5pct}`} />
              <Field label="AVFuel fee (3.5%)" value={`$${s.avFuelProcessingFee3_5pct}`} />
              <Field label="Net rent" value={`$${s.netRent}`} />
              <Field label={`Owner share (${s.ownerShareLabel})`} value={`$${s.ownerShareAmount}`} />
              <Field label="Adjustments" value={s.adjustments.map((a) => `$${a.amount} - ${a.note}`).join(", ")} />
              <Field label="Total due to owner" value={`$${s.totalDue}`} />
            </div>
            <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
              Remit to: {s.owner.name}, {s.owner.remitTo}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
