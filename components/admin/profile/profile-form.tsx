"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/app/(admin)/admin/profile/actions";
import AlertError from "@/components/forms/alert-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/types/auth";

export function ProfileForm({ user }: { user: User }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
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
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={user.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user.email}
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
