"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  confirmTwoFactorAction,
  disableTwoFactorAction,
  enableTwoFactorAction,
  regenerateRecoveryCodesAction,
  type TwoFactorEnrollment,
} from "@/app/(admin)/admin/profile/actions";
import PasswordInput from "@/components/forms/password-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useActionToast } from "@/hooks/use-action-toast";

function RecoveryCodesList({ codes }: { codes: string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-4 font-mono text-xs">
      {codes.map((code) => (
        <li key={code}>{code}</li>
      ))}
    </ul>
  );
}

function EnableTwoFactorFlow({ onEnabled }: { onEnabled: () => void }) {
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(
    null,
  );
  const [enableState, enableFormAction, enablePending] = useActionState(
    async (
      prev: Parameters<typeof enableTwoFactorAction>[0],
      formData: FormData,
    ) => {
      const result = await enableTwoFactorAction(prev, formData);
      if (result.ok && "secret" in result) {
        setEnrollment(result);
        toast.success("Scan the QR code and confirm to finish setup.");
      }
      return result;
    },
    null,
  );
  const [confirmState, confirmFormAction, confirmPending] = useActionState(
    confirmTwoFactorAction,
    null,
  );

  useActionToast(
    enableState && !enableState.ok
      ? { ok: false, message: enableState.message }
      : null,
  );
  useActionToast(confirmState);

  useEffect(() => {
    if (confirmState?.ok) {
      onEnabled();
    }
  }, [confirmState, onEnabled]);

  if (confirmState?.ok) {
    return null;
  }

  if (!enrollment) {
    return (
      <form action={enableFormAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="enable_current_password">Confirm your password</Label>
          <PasswordInput
            id="enable_current_password"
            name="current_password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" disabled={enablePending}>
          {enablePending ? "Starting…" : "Enable two-factor authentication"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">1. Scan this QR code</p>
        <div
          className="w-fit rounded-lg border bg-white p-3"
          // Generated server-side by Laravel's Fortify/Google2FA, not user input.
          dangerouslySetInnerHTML={{ __html: enrollment.qr_code_svg }}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Or enter this code manually: <code>{enrollment.secret}</code>
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">2. Save your recovery codes</p>
        <RecoveryCodesList codes={enrollment.recovery_codes} />
        <p className="mt-2 text-xs text-muted-foreground">
          Store these somewhere safe. Each code can be used once if you lose
          access to your authenticator app.
        </p>
      </div>

      <form action={confirmFormAction} className="space-y-4">
        <p className="text-sm font-medium">3. Confirm the code from your app</p>
        <InputOTP maxLength={6} name="code">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <Button type="submit" disabled={confirmPending}>
          {confirmPending ? "Confirming…" : "Confirm and enable"}
        </Button>
      </form>
    </div>
  );
}

function DisableTwoFactor({ onDisabled }: { onDisabled: () => void }) {
  const [state, formAction, pending] = useActionState(
    disableTwoFactorAction,
    null,
  );
  const [recoveryState, regenerateAction, regeneratePending] = useActionState(
    regenerateRecoveryCodesAction,
    null,
  );

  useActionToast(state);
  useActionToast(recoveryState);

  useEffect(() => {
    if (state?.ok) {
      onDisabled();
    }
  }, [state, onDisabled]);

  return (
    <div className="space-y-6">
      <Badge variant="secondary" className="w-fit">
        Two-factor authentication is enabled
      </Badge>

      <form action={regenerateAction} className="space-y-3">
        <p className="text-sm font-medium">Regenerate recovery codes</p>
        {recoveryState?.ok && recoveryState.recovery_codes ? (
          <RecoveryCodesList codes={recoveryState.recovery_codes} />
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="regen_current_password">Confirm your password</Label>
          <PasswordInput
            id="regen_current_password"
            name="current_password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" variant="outline" disabled={regeneratePending}>
          {regeneratePending ? "Regenerating…" : "Regenerate codes"}
        </Button>
      </form>

      <form action={formAction} className="space-y-3 border-t pt-5">
        <p className="text-sm font-medium">Disable two-factor authentication</p>
        <div className="space-y-2">
          <Label htmlFor="disable_current_password">
            Confirm your password
          </Label>
          <PasswordInput
            id="disable_current_password"
            name="current_password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Disabling…" : "Disable two-factor authentication"}
        </Button>
      </form>
    </div>
  );
}

export function TwoFactorSection({
  enabled: initialEnabled,
}: {
  enabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);

  return enabled ? (
    <DisableTwoFactor onDisabled={() => setEnabled(false)} />
  ) : (
    <EnableTwoFactorFlow onEnabled={() => setEnabled(true)} />
  );
}
