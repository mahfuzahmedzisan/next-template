import "server-only";

import { authedRequest } from "@/lib/auth/api";
import type {
  PaginationMeta,
  ThemePreference,
  User,
  UserDevice,
} from "@/types/auth";

export function updateProfile(input: {
  name: string;
  email: string;
  current_password?: string;
}) {
  return authedRequest<{ user: User }>("put", "/profile", input);
}

export function updatePassword(input: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  return authedRequest<null>("put", "/profile/password", input);
}

export function updatePreferences(input: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  theme?: ThemePreference;
  timezone?: string | null;
}) {
  return authedRequest<{ user: User }>("put", "/profile/preferences", input);
}

export function uploadAvatar(file: Blob, filename = "avatar.jpg") {
  const body = new FormData();
  body.append("avatar", file, filename);
  return authedRequest<{ user: User }>("post", "/profile/avatar", body);
}

export function deleteAvatar() {
  return authedRequest<{ user: User }>("delete", "/profile/avatar");
}

export function signOutOtherSessions(input: {
  current_password: string;
  include_current?: boolean;
}) {
  return authedRequest<{ revoked: number; signed_out_current: boolean }>(
    "delete",
    "/profile/sessions",
    input,
  );
}

export function listDevices() {
  return authedRequest<{ devices: UserDevice[] }>("get", "/profile/devices");
}

export function listDeviceHistory(page = 1) {
  return authedRequest<{ devices: UserDevice[]; meta: PaginationMeta }>(
    "get",
    `/profile/devices/history?page=${encodeURIComponent(String(page))}`,
  );
}

export function revokeDevice(id: number) {
  return authedRequest<null>("delete", `/profile/devices/${id}`);
}

export function forgetDevice(id: number) {
  return authedRequest<null>("delete", `/profile/devices/${id}/history`);
}

export function clearDeviceHistory() {
  return authedRequest<{ removed: number }>("delete", "/profile/devices/history");
}

export function deleteAccount(input: { current_password: string }) {
  return authedRequest<null>("delete", "/profile", input);
}

export function getTwoFactorStatus() {
  return authedRequest<{ enabled: boolean; pending_confirmation: boolean }>(
    "get",
    "/profile/two-factor-authentication",
  );
}

export function enableTwoFactor(input: { current_password: string }) {
  return authedRequest<{
    secret: string;
    qr_code_svg: string;
    recovery_codes: string[];
  }>("post", "/profile/two-factor-authentication", input);
}

export function confirmTwoFactor(input: { code: string }) {
  return authedRequest<null>(
    "post",
    "/profile/two-factor-authentication/confirm",
    input,
  );
}

export function disableTwoFactor(input: { current_password: string }) {
  return authedRequest<null>(
    "delete",
    "/profile/two-factor-authentication",
    input,
  );
}

export function regenerateRecoveryCodes(input: { current_password: string }) {
  return authedRequest<{ recovery_codes: string[] }>(
    "post",
    "/profile/two-factor-authentication/recovery-codes",
    input,
  );
}
