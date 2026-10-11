import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auditJsonError } from "@/lib/admin/route-errors";
import { getAuditEntry } from "@/lib/admin/audit";
import { getSession } from "@/lib/auth/auth-cookies";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/audit/[id]">) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const numeric = Number.parseInt(id, 10);
  if (!/^\d+$/.test(id) || numeric < 1) {
    return NextResponse.json({ message: "Audit entry not found." }, { status: 404 });
  }

  try {
    const activity = await getAuditEntry(numeric, "throw");
    return NextResponse.json({ data: { activity } });
  } catch (error) {
    return auditJsonError(error, "Unable to load this audit entry.");
  }
}
