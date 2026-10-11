"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { revokeDeviceAction } from "@/app/(admin)/admin/devices/actions";
import {
  DeviceIcon,
  deviceLabel,
  formatDateTime,
} from "@/components/admin/devices/device-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";
import type { UserDevice } from "@/types/auth";

export function DeviceList({ devices }: { devices: UserDevice[] }) {
  const timeZone = useDisplayTimeZone();
  const [target, setTarget] = useState<UserDevice | null>(null);
  const [pending, startTransition] = useTransition();

  function revoke() {
    if (!target) return;
    startTransition(async () => {
      const result = await revokeDeviceAction(target.id);
      if (result.ok) {
        toast.success(result.message);
        setTarget(null);
      } else {
        toast.error(result.message, { duration: 4000 });
      }
    });
  }

  if (devices.length === 0) {
    return <p className="text-sm text-muted-foreground">No devices are signed in.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
        {devices.map((device) => (
          <li key={device.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 gap-3">
              <DeviceIcon type={device.device_type} />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{deviceLabel(device)}</p>
                  {device.is_current ? <Badge>This device</Badge> : null}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {device.ip_address ?? "Unknown IP"} · Signed in{" "}
                  {formatDateTime(device.signed_in_at, timeZone)}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Last active {formatDateTime(device.last_active_at, timeZone)} ·{" "}
                  {device.remember ? "Remembered" : "Session"} until{" "}
                  {formatDateTime(device.expires_at, timeZone)}
                </p>
              </div>
            </div>
            {device.is_current ? null : (
              <Button
                variant="outline"
                size="sm"
                className="self-start sm:self-center"
                onClick={() => setTarget(device)}
              >
                Revoke
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={target !== null} onOpenChange={(open) => !open && !pending && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke this device?</DialogTitle>
            <DialogDescription>
              {target ? deviceLabel(target) : "This device"} will be signed out right away and
              moved to the history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={revoke} disabled={pending}>
              {pending ? "Revoking…" : "Revoke access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
