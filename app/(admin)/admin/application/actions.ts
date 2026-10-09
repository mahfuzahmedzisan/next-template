"use server";

import { revalidatePath } from "next/cache";

import { ApiError } from "@/lib/auth/api-error";
import { SessionExpiredError } from "@/lib/auth/session-expired";
import {
  saveGeneralSettings,
  saveSmtpSettings,
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

export async function saveGeneralAction(input: {
  name: string;
  short_name: string;
  registration_enabled: boolean;
  logo_url: string | null;
  favicon_url: string | null;
}): Promise<SettingsActionResult> {
  try {
    const settings = await saveGeneralSettings(input);
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
