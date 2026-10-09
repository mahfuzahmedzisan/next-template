"use server";

import { revalidatePath } from "next/cache";

import { ApiError } from "@/lib/auth/api-error";
import { SessionExpiredError } from "@/lib/auth/session-expired";
import {
  saveGeneralSettings,
  saveSmtpSettings,
  uploadBrandFile,
  type AdminSettings,
  type SmtpEncryption,
} from "@/lib/settings/admin";

export type SettingsActionResult =
  | { ok: true; message: string; settings: AdminSettings }
  | { ok: false; message: string };

function toResult(error: unknown, fallback: string): SettingsActionResult {
  if (error instanceof SessionExpiredError) throw error;

  if (error instanceof ApiError) {
    return { ok: false, message: error.message || fallback };
  }

  return { ok: false, message: fallback };
}

function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/icon");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/application", "layout");
}

export async function saveGeneralAction(formData: FormData): Promise<SettingsActionResult> {
  try {
    let settings = await saveGeneralSettings({
      name: String(formData.get("name") ?? ""),
      short_name: String(formData.get("short_name") ?? ""),
      registration_enabled: formData.get("registration_enabled") === "1",
      remove_logo: formData.get("remove_logo") === "1",
      remove_favicon: formData.get("remove_favicon") === "1",
    });

    const logo = formData.get("logo");
    const favicon = formData.get("favicon");

    if (logo instanceof File && logo.size > 0) {
      settings = await uploadBrandFile("logo", logo);
    }

    if (favicon instanceof File && favicon.size > 0) {
      settings = await uploadBrandFile("favicon", favicon);
    }

    refresh();
    return { ok: true, message: "General settings saved.", settings };
  } catch (error) {
    return toResult(error, "Unable to save general settings.");
  }
}

export async function saveSmtpAction(input: {
  enabled: boolean;
  host: string;
  port: number;
  encryption: SmtpEncryption;
  username: string;
  password: string;
  from_address: string;
  from_name: string;
}): Promise<SettingsActionResult> {
  try {
    const settings = await saveSmtpSettings(input);
    refresh();
    return { ok: true, message: "Mail settings saved.", settings };
  } catch (error) {
    return toResult(error, "Unable to save mail settings.");
  }
}
