import PageHeader from "@/components/PageHeader";
import Flag from "@/components/Flag";
import { getCustomerRates } from "@/lib/data";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const data = await getCustomerRates();

  return (
    <div>
      <PageHeader title="Customers" subtitle="Special-rate customer registry" />
      <div className="p-8">
        <Flag>{data._note}</Flag>
        <CustomersClient customers={data.customers} />
      </div>
    </div>
  );
}
