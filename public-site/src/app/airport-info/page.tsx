import { getAirportFacts } from "@/lib/data";
import { getMetar, getTaf, WEATHER_STATION } from "@/lib/aviation";

export const metadata = { title: "Airport Info | Ridgeline Aviation" };

function FdRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex justify-between py-2.5 text-[13.5px]"
      style={{ borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.08)" }}
    >
      <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
      <span className="numeral text-white">{value}</span>
    </div>
  );
}

export default async function AirportInfoPage() {
  const [facts, metar, taf] = await Promise.all([getAirportFacts(), getMetar(), getTaf()]);
  const runway = facts.runways[0];

  return (
    <div className="px-6 py-[70px]">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="font-display text-[32px] font-bold">Airport Info &amp; Flight Planning</h1>
        <p className="mt-2.5 max-w-[560px] text-[15px]" style={{ color: "var(--color-muted)" }}>
          {facts.icaoId} &mdash; {facts.name}. Built for the person building the trip packet, not
          just the pilot flying it.
        </p>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-3">
          <div className="dark-card p-[30px]">
            <span
              className="mb-5 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ background: "rgba(46,139,87,0.15)", color: "#6fd19a" }}
            >
              {metar ? `Live — ${WEATHER_STATION} (stand-in station)` : "Unavailable"}
            </span>
            <h2 className="mb-4 text-base font-semibold">{facts.icaoId} Current Conditions</h2>
            {metar ? (
              <div className="numeral text-sm" style={{ color: "var(--color-accent)" }}>
                {metar.rawOb}
              </div>
            ) : (
              <p className="text-sm text-white/50">Live weather is temporarily unavailable.</p>
            )}
            {taf?.rawTAF && (
              <p className="numeral mt-3 whitespace-pre-wrap text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                {taf.rawTAF}
              </p>
            )}
            <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Refreshes automatically. Not for flight planning &mdash; confirm with an official
              briefing.
            </p>
          </div>

          <div className="dark-card p-[30px]">
            <h2 className="mb-4 text-base font-semibold">Field Data</h2>
            <p className="mb-3 text-[11px]" style={{ color: "var(--color-accent)" }}>
              Static, sourced {facts.sourceEffectiveDate} &mdash; verify against current
              NOTAMs/AIRAC.
            </p>
            <FdRow label="Identifiers" value={`${facts.icaoId} / ${facts.faaId}`} />
            {runway && (
              <FdRow label="Runway" value={`${runway.id}, ${runway.lengthFt}' × ${runway.widthFt}', ${runway.surface.split(",")[0]}`} />
            )}
            <FdRow label="Field elevation" value={`${facts.elevationFt}'`} />
            <FdRow label="CTAF / Unicom" value={facts.ctafUnicomMhz} />
            <FdRow label="AWOS" value={facts.awosMhz} last />
          </div>

          <div className="dark-card p-[30px]">
            <h2 className="mb-4 text-base font-semibold">Quick Links</h2>
            <ul className="flex flex-col gap-3">
              {[
                { label: "Aviation Weather Center ↗", href: "https://aviationweather.gov" },
                { label: "FAA Chart Supplements ↗", href: "https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dafd/" },
                { label: "LiveATC ↗", href: "https://www.liveatc.net" },
              ].map((l) => (
                <li key={l.href} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }} className="pb-2.5">
                  <a href={l.href} target="_blank" rel="noreferrer" className="text-sm font-medium text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
