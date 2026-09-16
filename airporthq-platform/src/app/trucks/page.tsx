import PageHeader from "@/components/PageHeader";
import { getTruckLog } from "@/lib/data";
import TrucksClient from "./TrucksClient";

export default async function TrucksPage() {
  const log = await getTruckLog();

  return (
    <div>
      <PageHeader
        title="Trucks"
        subtitle="Fuel truck dispensing logs — fuel type per truck was not confirmed from source data"
      />
      <div className="p-8">
        <TrucksClient log={log} />
      </div>
    </div>
  );
}
