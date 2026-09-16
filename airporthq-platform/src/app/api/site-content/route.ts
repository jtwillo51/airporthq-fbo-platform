import { NextResponse } from "next/server";
import { saveSiteContent, type SiteContent } from "@/lib/data";

export async function PUT(request: Request) {
  const body = (await request.json()) as SiteContent;
  await saveSiteContent(body);
  return NextResponse.json(body);
}
