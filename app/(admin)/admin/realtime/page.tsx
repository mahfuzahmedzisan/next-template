import { redirect } from "next/navigation";

import { RealtimeConsole } from "@/components/admin/realtime/realtime-console";
import { getSession } from "@/lib/auth/auth-cookies";
import { RouteReady } from "@/components/transitions/route-ready";

export default async function RealtimePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <RouteReady />
      <div>
        <p className="text-sm text-muted-foreground">Workspace</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
          Realtime
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Smoke-test the Reverb connection: public ping, then a private event
          on your user channel.
        </p>
      </div>
      <RealtimeConsole userId={session.user.id} />
    </div>
  );
}
