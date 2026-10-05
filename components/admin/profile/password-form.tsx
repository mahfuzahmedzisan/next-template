"use client";

import { useActionState } from "react";

import { updatePasswordAction } from "@/app/(admin)/admin/profile/actions";
import PasswordInput from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useActionToast } from "@/hooks/use-action-toast";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    null,
  );

  useActionToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current_password">Current password</Label>
        <PasswordInput
          id="current_password"
          name="current_password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password_confirmation">Confirm new password</Label>
        <PasswordInput
          id="password_confirmation"
          name="password_confirmation"
          autoComplete="new-password"
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
