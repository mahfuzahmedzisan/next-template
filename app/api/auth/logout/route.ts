import { NextResponse } from "next/server";
import { revokeLaravelToken } from "@/lib/auth/api";
import { deleteSession, getSession } from "@/lib/auth/auth-cookies";

export async function POST() {
  const session = await getSession();

  if (session?.accessToken) {
    await revokeLaravelToken(session.accessToken);
  }

  await deleteSession();

  return NextResponse.json({ ok: true });
}
