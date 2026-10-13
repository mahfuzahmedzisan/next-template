import { StatusStage } from "@/components/status/status-stage";
import { RouteReady } from "@/components/transitions/route-ready";
import { TransitionLink as Link } from "@/components/transitions/transition-link";

export default function NotFound() {
  return (
    <StatusStage
      code="404"
      tone="missing"
      title="Page not found"
      description="That address is not on this site. The page may have moved, or the link may be out of date."
    >
      <RouteReady outcome="not-found" />
      <Link href="/" className="site-btn">
        Back to home
      </Link>
    </StatusStage>
  );
}
