"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/auth/api-error";
import {
  confirmTwoFactor,
  deleteAccount,
  deleteAvatar,
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorStatus,
  regenerateRecoveryCodes,
  updatePassword,
  updatePreferences,
  updateProfile,
  uploadAvatar,
} from "@/lib/auth/profile";
import {
  updateSession,
  getSession,
  deleteSession,
} from "@/lib/auth/auth-cookies";
import { revokeLaravelToken } from "@/lib/auth/api";
import type { ThemePreference } from "@/types/auth";

export type ActionResult =
  { ok: true; message: string } | { ok: false; message: string };

function toResult(error: unknown, fallback: string): ActionResult {
  const message = error instanceof ApiError ? error.message : fallback;
  return { ok: false, message };
}

async function syncSessionUser(
  user: Awaited<ReturnType<typeof updateProfile>>["user"],
) {
  const session = await getSession();
  if (session) {
    await updateSession({ ...session, user });
  }
}

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");

    const result = await updateProfile({ name, email });
    await syncSessionUser(result.user);

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/profile");
    return { ok: true, message: "Profile updated successfully." };
  } catch (error) {
    return toResult(error, "Unable to update profile.");
  }
}

export async function uploadAvatarAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "Choose an image file." };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false, message: "Choose an image file." };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false, message: "Keep the image under 2 MB." };
    }

    const result = await uploadAvatar(file, file.name || "avatar.jpg");
    await syncSessionUser(result.user);

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/profile");
    return { ok: true, message: "Avatar updated successfully." };
  } catch (error) {
    return toResult(error, "Unable to upload avatar.");
  }
}

export async function deleteAvatarAction(): Promise<ActionResult> {
  try {
    const result = await deleteAvatar();
    await syncSessionUser(result.user);

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/profile");
    return { ok: true, message: "Avatar removed successfully." };
  } catch (error) {
    return toResult(error, "Unable to remove avatar.");
  }
}

export async function updatePreferencesAction(input: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  theme?: ThemePreference;
}): Promise<ActionResult> {
  try {
    const result = await updatePreferences(input);
    await syncSessionUser(result.user);

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/settings");
    return { ok: true, message: "Preferences saved." };
  } catch (error) {
    return toResult(error, "Unable to save preferences.");
  }
}

export async function updatePasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await updatePassword({
      current_password: String(formData.get("current_password") ?? ""),
      password: String(formData.get("password") ?? ""),
      password_confirmation: String(
        formData.get("password_confirmation") ?? "",
      ),
    });
    return { ok: true, message: "Password updated successfully." };
  } catch (error) {
    return toResult(error, "Unable to update password.");
  }
}

export type TwoFactorEnrollment = {
  secret: string;
  qr_code_svg: string;
  recovery_codes: string[];
};

export async function getTwoFactorStatusAction() {
  return getTwoFactorStatus();
}

export async function enableTwoFactorAction(
  _prev: ActionResult | (TwoFactorEnrollment & { ok: true }) | null,
  formData: FormData,
): Promise<ActionResult | (TwoFactorEnrollment & { ok: true })> {
  try {
    const result = await enableTwoFactor({
      current_password: String(formData.get("current_password") ?? ""),
    });
    return { ok: true, ...result };
  } catch (error) {
    return toResult(error, "Unable to start two-factor enrollment.");
  }
}

export async function confirmTwoFactorAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await confirmTwoFactor({ code: String(formData.get("code") ?? "") });

    const session = await getSession();
    if (session) {
      await updateSession({
        ...session,
        user: { ...session.user, two_factor_enabled: true },
      });
    }

    revalidatePath("/admin", "layout");
    return { ok: true, message: "Two-factor authentication enabled." };
  } catch (error) {
    return toResult(error, "Unable to confirm two-factor authentication.");
  }
}

export async function disableTwoFactorAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await disableTwoFactor({
      current_password: String(formData.get("current_password") ?? ""),
    });

    const session = await getSession();
    if (session) {
      await updateSession({
        ...session,
        user: { ...session.user, two_factor_enabled: false },
      });
    }

    revalidatePath("/admin", "layout");
    return { ok: true, message: "Two-factor authentication disabled." };
  } catch (error) {
    return toResult(error, "Unable to disable two-factor authentication.");
  }
}

export async function regenerateRecoveryCodesAction(
  _prev: (ActionResult & { recovery_codes?: string[] }) | null,
  formData: FormData,
): Promise<ActionResult & { recovery_codes?: string[] }> {
  try {
    const result = await regenerateRecoveryCodes({
      current_password: String(formData.get("current_password") ?? ""),
    });
    return {
      ok: true,
      message: "Recovery codes regenerated.",
      recovery_codes: result.recovery_codes,
    };
  } catch (error) {
    return toResult(error, "Unable to regenerate recovery codes.");
  }
}

export async function deleteAccountAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await deleteAccount({
      current_password: String(formData.get("current_password") ?? ""),
    });
  } catch (error) {
    return toResult(error, "Unable to delete account.");
  }

  const session = await getSession();
  if (session?.accessToken) {
    await revokeLaravelToken(session.accessToken);
  }
  await deleteSession();
  redirect("/login");
}
