"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddEntryForm({
  tank,
  defaultStart,
}: {
  tank: "100LL" | "jetA";
  defaultStart: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startInventoryGal: defaultStart,
    gallonsDelivered: 0,
    gallonsPumped: 0,
    endStickInches: 0,
    endStickGal: 0,
    initials: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const bookInventoryGal =
      form.startInventoryGal + form.gallonsDelivered - form.gallonsPumped;
    const dailyOverShortGal = form.endStickGal - bookInventoryGal;
    await fetch("/api/fuel-tank-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tank,
        entry: {
          date: form.date,
          startInventoryGal: form.startInventoryGal,
          gallonsDelivered: form.gallonsDelivered,
          gallonsPumped: form.gallonsPumped,
          bookInventoryGal,
          endStickInches: form.endStickInches,
          endStickGal: form.endStickGal,
          dailyOverShortGal,
          cumulativeOverShortGal: dailyOverShortGal,
          initials: form.initials || null,
        },
      }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Date">
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="input"
        />
      </Field>
      <Field label="Start inventory (gal)">
        <input
          type="number"
          value={form.startInventoryGal}
          onChange={(e) => setForm({ ...form, startInventoryGal: Number(e.target.value) })}
          className="input"
        />
      </Field>
      <Field label="Gallons delivered">
        <input
          type="number"
          value={form.gallonsDelivered}
          onChange={(e) => setForm({ ...form, gallonsDelivered: Number(e.target.value) })}
          className="input"
        />
      </Field>
      <Field label="Gallons pumped">
        <input
          type="number"
          value={form.gallonsPumped}
          onChange={(e) => setForm({ ...form, gallonsPumped: Number(e.target.value) })}
          className="input"
        />
      </Field>
      <Field label="End stick (inches)">
        <input
          type="number"
          step="0.01"
          value={form.endStickInches}
          onChange={(e) => setForm({ ...form, endStickInches: Number(e.target.value) })}
          className="input"
        />
      </Field>
      <Field label="End stick (gal)">
        <input
          type="number"
          value={form.endStickGal}
          onChange={(e) => setForm({ ...form, endStickGal: Number(e.target.value) })}
          className="input"
        />
      </Field>
      <Field label="Initials">
        <input
          type="text"
          value={form.initials}
          onChange={(e) => setForm({ ...form, initials: e.target.value })}
          className="input"
        />
      </Field>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="hq-btn w-full justify-center">
          {pending ? "Saving…" : "Add entry"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-[color:var(--color-text-muted)]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
