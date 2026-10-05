"use client";

import { Camera, Trash2 } from "lucide-react";
import { useActionState, useRef, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
} from "@/app/(admin)/admin/profile/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionToast } from "@/hooks/use-action-toast";
import type { User } from "@/types/auth";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileForm({ user }: { user: User }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    null,
  );
  const [avatarState, avatarAction, avatarPending] = useActionState(
    uploadAvatarAction,
    null,
  );
  const [removing, startRemove] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useActionToast(state);
  useActionToast(avatarState);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="relative">
          <Avatar size="lg" className="size-20 data-[size=lg]:size-20">
            {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
            <AvatarFallback className="text-lg">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarPending || removing}
            className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-border bg-background shadow-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            aria-label="Change avatar"
          >
            <Camera className="size-3.5" />
          </button>
          <form action={avatarAction} className="sr-only">
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  toast.error("Choose an image file.");
                  event.target.value = "";
                  return;
                }
                if (file.size > 2 * 1024 * 1024) {
                  toast.error("Keep the image under 2 MB.");
                  event.target.value = "";
                  return;
                }
                event.currentTarget.form?.requestSubmit();
              }}
            />
          </form>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={avatarPending || removing}
              onClick={() => fileRef.current?.click()}
            >
              {avatarPending ? "Uploading…" : "Upload photo"}
            </Button>
            {user.avatar ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={avatarPending || removing}
                onClick={() => {
                  startRemove(async () => {
                    const result = await deleteAvatarAction();
                    if (result.ok) toast.success(result.message);
                    else toast.error(result.message);
                  });
                }}
              >
                <Trash2 className="size-3.5" />
                {removing ? "Removing…" : "Remove"}
              </Button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG or PNG up to 2 MB. Synced to your account.
          </p>
        </div>
      </div>

      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={user.name}
            required
            className="min-h-10"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email}
            required
            className="min-h-10"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending} className="min-h-10">
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
