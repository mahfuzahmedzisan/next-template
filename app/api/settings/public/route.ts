import { NextResponse } from "next/server";

import { fetchPublicSettings } from "@/lib/settings/public";

export async function GET() {
  return NextResponse.json(await fetchPublicSettings());
}
