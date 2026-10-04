"use client";

import { useActionState, useState } from "react";

import { deleteAccountAction } from "@/app/(admin)/admin/profile/actions";
import AlertError from "@/components/forms/alert-error";
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

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteAccountAction,
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This cannot be undone. Confirm your password to permanently delete
            your account and revoke all sessions.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state && !state.ok ? <AlertError errors={[state.message]} /> : null}

          <div className="space-y-2">
            <Label htmlFor="delete_current_password">Password</Label>
            <PasswordInput
              id="delete_current_password"
              name="current_password"
              autoComplete="current-password"
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting…" : "Permanently delete account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
