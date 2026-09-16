import PageHeader from "@/components/PageHeader";
import { getShopStorage, getTieDown } from "@/lib/data";
import AircraftClient from "./AircraftClient";

export default async function AircraftPage() {
  const [tieDown, shopStorage] = await Promise.all([getTieDown(), getShopStorage()]);

  return (
    <div>
      <PageHeader
        title="Aircraft Location"
        subtitle="Ramp tie-down and shop storage — aircraft location tracking, not parts/stock inventory"
      />
      <div className="p-8">
        <AircraftClient tieDown={tieDown.days} shopStorage={shopStorage.days} />
      </div>
    </div>
  );
}
