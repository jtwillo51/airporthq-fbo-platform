"use client";

import { useState } from "react";
import type { BusinessDirectory } from "@/lib/data";

type Listing = BusinessDirectory["listings"][number];

const BLANK: Listing = { name: "", category: "", description: "", contact: "", active: true };

export default function BusinessDirectoryEditor({ initial }: { initial: BusinessDirectory }) {
  const [listings, setListings] = useState<Listing[]>(initial.listings);
  const [isMockData, setIsMockData] = useState(initial.isMockData);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(i: number, patch: Partial<Listing>) {
    setListings((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function remove(i: number) {
    setListings((prev) => prev.filter((_, idx) => idx !== i));
  }

  function add() {
    setListings((prev) => [...prev, { ...BLANK }]);
  }

  async function save() {
    setPending(true);
    setStatus(null);
    await fetch("/api/business-directory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isMockData, listings }),
    });
    setPending(false);
    setStatus("Saved — the public Local Businesses page now reflects this list.");
  }

  return (
    <div>
      <label className="mb-6 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isMockData} onChange={(e) => setIsMockData(e.target.checked)} />
        Show &quot;example listings&quot; banner on the public page (uncheck once these are real)
      </label>

      <div className="space-y-4">
        {listings.map((l, i) => (
          <div key={i} className="hq-card p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Business name" value={l.name} onChange={(v) => update(i, { name: v })} />
              <Field label="Category" value={l.category} onChange={(v) => update(i, { category: v })} />
            </div>
            <div className="mt-3">
              <Field
                label="Description"
                value={l.description}
                onChange={(v) => update(i, { description: v })}
                textarea
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <Field label="Contact" value={l.contact} onChange={(v) => update(i, { contact: v })} />
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={l.active}
                  onChange={(e) => update(i, { active: e.target.checked })}
                />
                Active on public site
              </label>
              <button
                type="button"
                onClick={() => remove(i)}
                className="hq-btn hq-btn--ghost self-end"
                style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {listings.length === 0 && (
          <p className="text-sm text-[color:var(--color-text-muted)]">
            No listings yet — add one below.
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button type="button" onClick={add} className="hq-btn hq-btn--ghost">
          + Add listing
        </button>
        <button type="button" onClick={save} disabled={pending} className="hq-btn">
          {pending ? "Saving…" : "Save changes"}
        </button>
        {status && <span className="text-sm text-[color:var(--color-success)]">{status}</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block text-xs text-[color:var(--color-text-muted)]">
      {label}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="input mt-1" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1" />
      )}
    </label>
  );
}
