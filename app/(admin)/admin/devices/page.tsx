import { redirect } from "next/navigation";

import {
  AccountPageHeader,
  AccountSection,
} from "@/components/admin/account/account-chrome";
import { DeviceHistory } from "@/components/admin/devices/device-history";
import { DeviceList } from "@/components/admin/devices/device-list";
import { SignOutEverywhere } from "@/components/admin/devices/sign-out-everywhere";
import { RouteReady } from "@/components/transitions/route-ready";
import { getSession } from "@/lib/auth/auth-cookies";
import { listDeviceHistory, listDevices } from "@/lib/auth/profile";

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const rawPage = (await searchParams).page;
  const page = Math.max(1, Number.parseInt(String(rawPage ?? "1"), 10) || 1);

  const [{ devices }, history] = await Promise.all([
    listDevices(),
    listDeviceHistory(page),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <RouteReady />
      <AccountPageHeader
        active="devices"
        title="Devices"
        description="See where your account is signed in, revoke access, and review past sign-ins."
      />

      <AccountSection
        title="Signed-in devices"
        description="Each sign-in is listed with its browser, IP address and when it was last used."
      >
        <div className="space-y-4">
          <DeviceList devices={devices} />
          <SignOutEverywhere />
        </div>
      </AccountSection>

      <AccountSection
        title="History"
        description="Devices that signed out, were revoked, or expired."
      >
        <DeviceHistory devices={history.devices} meta={history.meta} />
      </AccountSection>
    </div>
  );
}
