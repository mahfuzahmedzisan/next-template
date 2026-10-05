"use client";

import { Camera, Trash2 } from "lucide-react";
import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateProfileAction } from "@/app/(admin)/admin/profile/actions";
import { AvatarCropDialog } from "@/components/admin/profile/avatar-crop-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAvatarClient } from "@/lib/auth/avatar-upload";
import { useActionToast } from "@/hooks/use-action-toast";
import type { User } from "@/types/auth";

const SOURCE_LIMIT = 8 * 1024 * 1024;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    null,
  );
  const [removing, startRemove] = useTransition();
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useActionToast(state);

  function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > SOURCE_LIMIT) {
      toast.error("Keep the original image under 8 MB.");
      return;
    }

    setCropFile(file);
    setCropOpen(true);
  }

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
            disabled={removing}
            className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-border bg-background shadow-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            aria-label="Change avatar"
          >
            <Camera className="size-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              onPick(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={removing}
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </Button>
            {user.avatar ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={removing}
                onClick={() => {
                  startRemove(async () => {
                    try {
                      const message = await deleteAvatarClient();
                      toast.success(message);
                      router.refresh();
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Unable to remove avatar.",
                      );
                    }
                  });
                }}
              >
                <Trash2 className="size-3.5" />
                {removing ? "Removing…" : "Remove"}
              </Button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Crop inside the circle. The photo is stored as an optimized WebP.
          </p>
        </div>
      </div>

      {cropOpen && cropFile ? (
        <AvatarCropDialog
          key={`${cropFile.name}-${cropFile.size}-${cropFile.lastModified}`}
          file={cropFile}
          onClose={() => setCropOpen(false)}
          onUploaded={() => router.refresh()}
        />
      ) : null}

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
