"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  clearHistoryAction,
  forgetDeviceAction,
} from "@/app/(admin)/admin/devices/actions";
import {
  DeviceIcon,
  deviceLabel,
  formatDateTime,
  inactiveLabel,
} from "@/components/admin/devices/device-meta";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import { Badge } from "@/components/ui/badge";
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
import type { ActionResult } from "@/lib/actions/result";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";
import type { PaginationMeta, UserDevice } from "@/types/auth";

function notify(result: ActionResult) {
  if (result.ok) toast.success(result.message);
  else toast.error(result.message, { duration: 4000 });
}

export function DeviceHistory({
  devices,
  meta,
}: {
  devices: UserDevice[];
  meta: PaginationMeta;
}) {
  const timeZone = useDisplayTimeZone();
  const [removing, setRemoving] = useState<number | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function forget(id: number) {
    setRemoving(id);
    startTransition(async () => {
      notify(await forgetDeviceAction(id));
      setRemoving(null);
    });
  }

  function clear() {
    startTransition(async () => {
      const result = await clearHistoryAction();
      notify(result);
      if (result.ok) setClearOpen(false);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5 text-muted-foreground">
          {meta.total === 0
            ? "No signed-out devices yet."
            : `${meta.total} ${meta.total === 1 ? "entry" : "entries"}`}
        </p>
        {meta.total > 0 ? (
          <Dialog open={clearOpen} onOpenChange={(open) => !pending && setClearOpen(open)}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Clear history
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear the device history?</DialogTitle>
                <DialogDescription>
                  Every revoked and expired device is removed from the history. Signed-in
                  devices are not affected.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClearOpen(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={clear} disabled={pending}>
                  {pending ? "Clearing…" : "Clear history"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {devices.length > 0 ? (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
          {devices.map((device) => (
            <li key={device.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 gap-3">
                <DeviceIcon type={device.device_type} />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{deviceLabel(device)}</p>
                    <Badge variant={device.status === "expired" ? "secondary" : "destructive"}>
                      {inactiveLabel(device)}
                    </Badge>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {device.ip_address ?? "Unknown IP"} · Signed in{" "}
                    {formatDateTime(device.signed_in_at, timeZone)}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Last active {formatDateTime(device.last_active_at, timeZone)} ·{" "}
                    {device.status === "expired" ? "Expired" : "Ended"}{" "}
                    {formatDateTime(
                      device.status === "expired" ? device.expires_at : device.revoked_at,
                      timeZone,
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-muted-foreground sm:self-center"
                onClick={() => forget(device.id)}
                disabled={pending}
              >
                {removing === device.id ? "Removing…" : "Remove"}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {meta.last_page > 1 ? (
        <nav aria-label="History pages" className="flex items-center justify-between gap-3 text-sm">
          {meta.current_page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/devices?page=${meta.current_page - 1}`}>Previous</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </span>
          {meta.current_page < meta.last_page ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/devices?page=${meta.current_page + 1}`}>Next</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <p className="text-xs leading-5 text-muted-foreground">
        Revoked and expired devices are removed automatically after 30 days.
      </p>
    </div>
  );
}
