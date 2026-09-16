import PageHeader from "@/components/PageHeader";
import { getHangarSettlements } from "@/lib/data";
import HangarSettlementsClient from "./HangarSettlementsClient";

export default async function HangarSettlementsPage() {
  const data = await getHangarSettlements();

  return (
    <div>
      <PageHeader title="Hangar Settlements" subtitle={data.period} />
      <div className="p-8">
        <HangarSettlementsClient settlements={data.settlements} />
      </div>
    </div>
  );
}
