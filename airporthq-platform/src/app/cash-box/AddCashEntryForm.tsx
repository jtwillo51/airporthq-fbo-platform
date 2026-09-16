"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddCashEntryForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    transactionDetails: "",
    amount: 0,
    initials: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await fetch("/api/cash-box", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setPending(false);
    setForm({ ...form, transactionDetails: "", amount: 0 });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <label className="block text-xs text-[color:var(--color-text-muted)]">
        Date
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="input mt-1"
        />
      </label>
      <label className="block text-xs text-[color:var(--color-text-muted)]">
        Details
        <input
          type="text"
          value={form.transactionDetails}
          onChange={(e) => setForm({ ...form, transactionDetails: e.target.value })}
          className="input mt-1"
        />
      </label>
      <label className="block text-xs text-[color:var(--color-text-muted)]">
        Amount (+/-)
        <input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          className="input mt-1"
        />
      </label>
      <label className="block text-xs text-[color:var(--color-text-muted)]">
        Initials
        <input
          type="text"
          value={form.initials}
          onChange={(e) => setForm({ ...form, initials: e.target.value })}
          className="input mt-1"
        />
      </label>
      <div className="col-span-2 sm:col-span-4">
        <button type="submit" disabled={pending} className="hq-btn">
          {pending ? "Saving…" : "Add entry"}
        </button>
      </div>
    </form>
  );
}
