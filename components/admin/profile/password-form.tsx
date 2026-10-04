"use client";

import { useActionState } from "react";

import { updatePasswordAction } from "@/app/(admin)/admin/profile/actions";
import AlertError from "@/components/forms/alert-error";
import PasswordInput from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <AlertError errors={[state.message]} /> : null}
      {state?.ok ? (
        <p className="rounded-lg border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}

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
