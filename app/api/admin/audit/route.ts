import { NextResponse } from "next/server";

import { auditJsonError } from "@/lib/admin/route-errors";
import { listAuditEntries, toAuditQuery } from "@/lib/admin/audit";
import { getSession } from "@/lib/auth/auth-cookies";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const data = await listAuditEntries(toAuditQuery(new URL(request.url).searchParams), "throw");
    return NextResponse.json({ data });
  } catch (error) {
    return auditJsonError(error, "Unable to load the audit log.");
  }
}
