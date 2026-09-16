import Link from "next/link";
import { getFuelPrices, getSiteContent } from "@/lib/data";
import FuelBoard from "@/components/FuelBoard";

export default async function HomePage() {
  const [site, prices] = await Promise.all([getSiteContent(), getFuelPrices()]);

  return (
    <div>
      <section
        className="relative overflow-hidden px-6 pb-[120px] pt-20"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(122,35,51,0.55), transparent 55%), radial-gradient(circle at 80% 0%, rgba(217,170,62,0.25), transparent 45%), linear-gradient(160deg,#1B2230 0%, #0F1319 65%)",
        }}
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[1.3fr_0.9fr]">
          <div>
            <h1
              className="font-display text-[38px] font-bold leading-[1.05] tracking-[-0.01em] text-white sm:text-[50px]"
            >
              {site.heroHeadline}
            </h1>
            <p className="mt-[18px] max-w-[460px] text-base" style={{ color: "rgba(255,255,255,0.85)" }}>
              {site.heroSubheadline}
            </p>
            <div className="mt-[30px] flex flex-wrap gap-3.5">
              <Link href="/services" className="btn btn-primary">
                View Fuel Prices
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                Request Fuel
              </Link>
            </div>
          </div>

          <FuelBoard prices={prices} />
        </div>
      </section>

      <section className="px-6 py-[70px]" style={{ background: "var(--color-paper)" }}>
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-display text-[32px] font-bold">Everything the ramp needs, handled.</h2>
          <p className="mt-2.5 max-w-[500px] text-[15px]" style={{ color: "var(--color-muted)" }}>
            {site.services.length} services, one crew.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {site.services.map((s) => (
              <div
                key={s.name}
                className="rounded-[20px] border bg-white p-6"
                style={{ borderColor: "var(--color-line)" }}
              >
                <span className="text-2xl" aria-hidden="true">
                  {s.icon}
                </span>
                <p className="mt-4 font-semibold">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
