"use client";

import { useActionState, useState } from "react";

import {
  signOutOtherSessionsAction,
  type ActionResult,
} from "@/app/(admin)/admin/profile/actions";
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
import { useActionToast } from "@/hooks/use-action-toast";

export function OtherSessions() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await signOutOtherSessionsAction(prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    null,
  );

  useActionToast(state);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign out other devices</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign out other devices?</DialogTitle>
          <DialogDescription>
            Every other browser and device signed in to this account will be
            signed out. This device stays signed in.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessions_current_password">Password</Label>
            <PasswordInput
              id="sessions_current_password"
              name="current_password"
              autoComplete="current-password"
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Signing out…" : "Sign out other devices"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
