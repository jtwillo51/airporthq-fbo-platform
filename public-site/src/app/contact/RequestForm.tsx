"use client";

import { useState } from "react";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[18px]">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--color-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid var(--color-line)",
  borderRadius: 8,
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

export default function RequestForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="mt-10 max-w-[560px] rounded-[20px] border bg-white p-8"
      style={{ borderColor: "var(--color-line)" }}
    >
      <Field label="Submitted By">
        <input type="text" placeholder="Dispatcher / flight planner name" required style={inputStyle} />
      </Field>
      <Field label="Tail Number">
        <input type="text" placeholder="N12345" required style={inputStyle} />
      </Field>
      <Field label="Aircraft Type">
        <input type="text" placeholder="e.g. Citation CJ3, King Air 350" style={inputStyle} />
      </Field>
      <Field label="ETA">
        <input type="text" placeholder="3:00 PM today" required style={inputStyle} />
      </Field>
      <Field label="Fuel Needed">
        <select style={inputStyle}>
          <option>100LL</option>
          <option>Jet A</option>
        </select>
      </Field>
      <Field label="Notes">
        <textarea rows={3} placeholder="Gallons, self-serve vs full-serve, anything else" style={inputStyle} />
      </Field>
      <button type="submit" className="btn btn-primary w-full justify-center">
        Submit Request
      </button>
      {submitted && (
        <div
          className="mt-[18px] rounded-[10px] px-[18px] py-4 text-sm font-semibold"
          style={{ background: "rgba(46,139,87,0.1)", border: "1px solid var(--color-success)", color: "var(--color-success)" }}
        >
          &#10003; Request received &mdash; this would land directly in the AirportHQ dashboard,
          not an inbox.
        </div>
      )}
    </form>
  );
}
