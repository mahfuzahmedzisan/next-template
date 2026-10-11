import { NextResponse } from "next/server";

import { auditJsonError } from "@/lib/admin/route-errors";
import { listMyActivity } from "@/lib/admin/audit";
import { getSession } from "@/lib/auth/auth-cookies";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  const perPage = Number.parseInt(params.get("per_page") ?? "15", 10);

  try {
    const data = await listMyActivity(
      {
        page: page > 0 ? page : 1,
        perPage: perPage > 0 && perPage <= 50 ? perPage : 15,
        category: params.get("category")?.trim() || undefined,
      },
      "throw",
    );
    return NextResponse.json({ data });
  } catch (error) {
    return auditJsonError(error, "Unable to load your activity.");
  }
}
