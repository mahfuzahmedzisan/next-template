"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  pingRealtimeAction,
  privateRealtimeAction,
  realtimeHealthAction,
  type RealtimeHealthData,
} from "@/app/(admin)/admin/realtime/actions";
import { Button } from "@/components/ui/button";
import {
  disconnectEcho,
  getEcho,
  reconnectEcho,
} from "@/lib/realtime/echo";
import {
  isReverbConfigured,
  reverbPublicConfig,
} from "@/lib/realtime/config";

type PingPayload = {
  message?: string;
  triggered_at?: string;
  source?: string;
};

type PrivatePayload = {
  message?: string;
  triggered_at?: string;
  user_id?: number;
};

type LogLine = {
  at: string;
  text: string;
};

function nowLabel() {
  return new Date().toISOString();
}

export function RealtimeConsole({ userId }: { userId: string | number }) {
  const config = reverbPublicConfig();
  const configured = isReverbConfigured();
  const [status, setStatus] = useState(configured ? "connecting" : "not configured");
  const [socketId, setSocketId] = useState<string | null>(null);
  const [health, setHealth] = useState<RealtimeHealthData | null>(null);
  const [events, setEvents] = useState<LogLine[]>([]);
  const [log, setLog] = useState<LogLine[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  function pushLog(text: string) {
    setLog((current) => [{ at: nowLabel(), text }, ...current].slice(0, 40));
  }

  function pushEvent(text: string) {
    setEvents((current) => [{ at: nowLabel(), text }, ...current].slice(0, 40));
  }

  useEffect(() => {
    const echo = getEcho();
    if (!echo) {
      return;
    }

    const connection = echo.connector.pusher.connection;
    const onState = (state: { current?: string }) => {
      setStatus(state.current ?? "unknown");
      setSocketId(connection.socket_id ?? null);
    };

    connection.bind("state_change", onState);
    connection.bind("connected", () => {
      setStatus("connected");
      setSocketId(connection.socket_id ?? null);
      pushLog(`connected ${connection.socket_id ?? ""}`.trim());
    });
    connection.bind("error", (error: unknown) => {
      setStatus("failed");
      pushLog(`connection error ${JSON.stringify(error)}`);
    });

    const publicChannel = echo.channel("reverb-ping");
    publicChannel.listen(".ping", (payload: unknown) => {
      const data = (payload ?? {}) as PingPayload;
      pushEvent(`reverb-ping .ping ${JSON.stringify(payload)}`);
      toast.success("Public signal received", {
        description: data.message ?? "reverb-ping · ping",
      });
    });

    const privateChannel = echo.private(`App.Models.User.${userId}`);
    privateChannel.listen(".realtime.test", (payload: unknown) => {
      const data = (payload ?? {}) as PrivatePayload;
      pushEvent(`private .realtime.test ${JSON.stringify(payload)}`);
      toast.success("Private signal received", {
        description: data.message ?? `App.Models.User.${userId}`,
      });
    });
    privateChannel.error((error: unknown) => {
      pushLog(`private auth error ${JSON.stringify(error)}`);
      toast.error("Private channel auth failed");
    });

    return () => {
      echo.leave("reverb-ping");
      echo.leave(`private-App.Models.User.${userId}`);
      connection.unbind("state_change", onState);
      disconnectEcho();
    };
  }, [userId]);

  async function onPing() {
    setBusy("ping");
    const result = await pingRealtimeAction("Hello from the admin console");
    setBusy(null);
    if (!result.ok) {
      pushLog(result.message);
      return;
    }
    pushLog(`dispatched public ping on ${result.data.channel}`);
  }

  async function onPrivate() {
    setBusy("private");
    const result = await privateRealtimeAction();
    setBusy(null);
    if (!result.ok) {
      pushLog(result.message);
      return;
    }
    pushLog(`dispatched private test on ${result.data.channel}`);
  }

  async function onHealth() {
    setBusy("health");
    const result = await realtimeHealthAction();
    setBusy(null);
    if (!result.ok) {
      pushLog(result.message);
      return;
    }
    setHealth(result.data);
    pushLog("backend config loaded");
  }

  function onReconnect() {
    setStatus("connecting");
    setSocketId(null);
    reconnectEcho();
    pushLog("reconnect requested");
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={
            status === "connected"
              ? "size-2.5 rounded-full bg-emerald-500"
              : "size-2.5 rounded-full bg-amber-500"
          }
          aria-hidden
        />
        <p className="text-sm">
          <span className="font-medium">{status}</span>
          {socketId ? (
            <span className="text-muted-foreground"> · {socketId}</span>
          ) : null}
        </p>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Host</dt>
          <dd>
            {config.scheme}://{config.host}:{config.port}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">forceTLS</dt>
          <dd>{String(config.useTls)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">App key</dt>
          <dd>{config.key ? `${config.key.slice(0, 8)}...` : "missing"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Auth</dt>
          <dd>/api/broadcasting/auth</dd>
        </div>
        {health ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">API</dt>
            <dd>
              {health.broadcast_connection} · {health.scheme}://{health.host}:
              {health.port} · {health.app_key_preview ?? "no key"}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onReconnect} variant="outline">
          Reconnect
        </Button>
        <Button type="button" onClick={onPing} disabled={busy !== null || !configured}>
          Trigger public ping
        </Button>
        <Button
          type="button"
          onClick={onPrivate}
          disabled={busy !== null || !configured}
          variant="secondary"
        >
          Trigger private test
        </Button>
        <Button type="button" onClick={onHealth} disabled={busy !== null} variant="outline">
          Check backend config
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setEvents([]);
            setLog([]);
          }}
        >
          Clear
        </Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <LogPanel title="Received events" lines={events} empty="No events yet." />
        <LogPanel title="Debug log" lines={log} empty="No log lines yet." />
      </section>
    </div>
  );
}

function LogPanel({
  title,
  lines,
  empty,
}: {
  title: string;
  lines: LogLine[];
  empty: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-3 max-h-72 space-y-2 overflow-auto font-mono text-xs leading-5">
        {lines.length === 0 ? (
          <li className="text-muted-foreground">{empty}</li>
        ) : (
          lines.map((line) => (
            <li key={`${line.at}-${line.text}`}>
              <span className="text-muted-foreground">{line.at}</span>
              <br />
              {line.text}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
