"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toResult, type ActionResult } from "@/lib/actions/result";
import { deleteSession } from "@/lib/auth/auth-cookies";
import {
  clearDeviceHistory,
  forgetDevice,
  revokeDevice,
  signOutOtherSessions,
} from "@/lib/auth/profile";

export async function revokeDeviceAction(id: number): Promise<ActionResult> {
  try {
    await revokeDevice(id);
    revalidatePath("/admin/devices");
    return { ok: true, message: "Device signed out." };
  } catch (error) {
    return toResult(error, "Unable to sign out this device.");
  }
}

export async function forgetDeviceAction(id: number): Promise<ActionResult> {
  try {
    await forgetDevice(id);
    revalidatePath("/admin/devices");
    return { ok: true, message: "Removed from the history." };
  } catch (error) {
    return toResult(error, "Unable to remove this device.");
  }
}

export async function clearHistoryAction(): Promise<ActionResult> {
  try {
    const { removed } = await clearDeviceHistory();
    revalidatePath("/admin/devices");
    return {
      ok: true,
      message:
        removed === 0
          ? "The history was already empty."
          : `Removed ${removed} ${removed === 1 ? "entry" : "entries"} from the history.`,
    };
  } catch (error) {
    return toResult(error, "Unable to clear the history.");
  }
}

export async function signOutEverywhereAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const includeCurrent = formData.get("include_current") === "on";
  let result: { revoked: number; signed_out_current: boolean };

  try {
    result = await signOutOtherSessions({
      current_password: String(formData.get("current_password") ?? ""),
      include_current: includeCurrent,
    });
  } catch (error) {
    return toResult(error, "Unable to sign out other devices.");
  }

  if (result.signed_out_current) {
    await deleteSession();
    redirect("/login");
  }

  revalidatePath("/admin/devices");
  const { revoked } = result;
  return {
    ok: true,
    message:
      revoked === 0
        ? "No other devices were signed in."
        : `Signed out of ${revoked} other ${revoked === 1 ? "device" : "devices"}.`,
  };
}
