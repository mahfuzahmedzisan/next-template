"use server";

import { redirect } from "next/navigation";

import { revokeLaravelToken } from "@/lib/auth/api";
import { deleteSession, getSession } from "@/lib/auth/auth-cookies";

export async function logoutAction(): Promise<void> {
  const session = await getSession();

  if (session?.accessToken) {
    await revokeLaravelToken(session.accessToken);
  }

  await deleteSession();
  redirect("/login");
}
