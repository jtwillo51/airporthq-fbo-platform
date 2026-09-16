import PageHeader from "@/components/PageHeader";
import { getFuelTankLog } from "@/lib/data";
import AddEntryForm from "./AddEntryForm";
import FuelLogsClient from "./FuelLogsClient";

export default async function FuelPage() {
  const tanks = await getFuelTankLog();
  const start100LL = tanks["100LL"].at(-1)?.endStickGal ?? 0;
  const startJetA = tanks.jetA.at(-1)?.endStickGal ?? 0;

  return (
    <div>
      <PageHeader title="Fuel Tank Logs" subtitle="Daily reconciliation — 100LL and Jet A" />
      <div className="space-y-10 p-8">
        <section>
          <h2 className="mb-3 font-semibold">Log today&apos;s 100LL entry</h2>
          <AddEntryForm tank="100LL" defaultStart={start100LL} />
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Log today&apos;s Jet A entry</h2>
          <AddEntryForm tank="jetA" defaultStart={startJetA} />
        </section>
        <FuelLogsClient tanks={tanks} />
      </div>
    </div>
  );
}
