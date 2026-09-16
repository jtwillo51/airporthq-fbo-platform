import { NextResponse } from "next/server";
import { getCashBox, saveCashBox, type CashEntry } from "@/lib/data";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    date: string;
    transactionDetails: string;
    amount: number;
    initials?: string;
  };
  const current = await getCashBox();
  const lastTotal = current.entries.at(-1)?.runningTotal ?? 0;
  const entry: CashEntry = {
    date: body.date,
    transactionDetails: body.transactionDetails,
    amount: body.amount,
    runningTotal: Math.round((lastTotal + body.amount) * 100) / 100,
    initials: body.initials ?? null,
  };
  const updated = { entries: [...current.entries, entry] };
  await saveCashBox(updated);
  return NextResponse.json(updated);
}
