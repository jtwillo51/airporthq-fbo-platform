import { getSiteContent } from "@/lib/data";
import RequestForm from "./RequestForm";

export const metadata = { title: "Contact | Ridgeline Aviation" };

export default async function ContactPage() {
  const site = await getSiteContent();

  return (
    <div className="px-6 py-[70px]">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="font-display text-[32px] font-bold">Request Fuel / Get in Touch</h1>
        <p className="mt-2.5 max-w-[500px] text-[15px]" style={{ color: "var(--color-muted)" }}>
          Planning a trip in? Submit the details ahead of time and we&apos;ll have fuel staged
          &mdash; or call {site.phone}.
        </p>
        <RequestForm />
      </div>
    </div>
  );
}
