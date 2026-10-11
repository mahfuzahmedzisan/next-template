"use client";

import { useActionState, useState } from "react";

import { signOutEverywhereAction } from "@/app/(admin)/admin/devices/actions";
import PasswordInput from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useActionToast } from "@/hooks/use-action-toast";
import type { ActionResult } from "@/lib/actions/result";

export function SignOutEverywhere() {
  const [open, setOpen] = useState(false);
  const [includeCurrent, setIncludeCurrent] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await signOutEverywhereAction(prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    null,
  );

  useActionToast(state);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign out of all devices</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign out of all devices?</DialogTitle>
          <DialogDescription>
            Every other browser and device signed in to this account loses access right away.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="everywhere_current_password">Password</Label>
            <PasswordInput
              id="everywhere_current_password"
              name="current_password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-3">
            <div className="space-y-1">
              <Label htmlFor="everywhere_include_current">Also sign out this device</Label>
              <p className="text-xs leading-5 text-muted-foreground">
                You will be taken to the sign-in page.
              </p>
            </div>
            <Switch
              id="everywhere_include_current"
              name="include_current"
              checked={includeCurrent}
              onCheckedChange={setIncludeCurrent}
            />
          </div>

          <DialogFooter>
            <Button type="submit" variant={includeCurrent ? "destructive" : "default"} disabled={pending}>
              {pending
                ? "Signing out…"
                : includeCurrent
                  ? "Sign out everywhere"
                  : "Sign out other devices"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
