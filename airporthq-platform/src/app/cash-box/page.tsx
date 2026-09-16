import PageHeader from "@/components/PageHeader";
import { getCashBox } from "@/lib/data";
import AddCashEntryForm from "./AddCashEntryForm";
import CashBoxClient from "./CashBoxClient";

export default async function CashBoxPage() {
  const cashBox = await getCashBox();

  return (
    <div>
      <PageHeader title="Cash Box" subtitle="Running ledger" />
      <div className="space-y-8 p-8">
        <section>
          <h2 className="mb-3 font-semibold">Add entry</h2>
          <AddCashEntryForm />
        </section>
        <section>
          <CashBoxClient entries={cashBox.entries} />
        </section>
      </div>
    </div>
  );
}
