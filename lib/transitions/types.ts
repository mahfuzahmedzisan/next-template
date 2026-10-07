export type TransitionRequestId = number;
export type RouteKey = string;

export type TransitionPhase =
  | "idle"
  | "navigationDispatched"
  | "routeWaiting"
  | "routeRevealing"
  | "recovering";

export type TransitionEvent =
  | {
      type: "READINESS_REGISTERED";
      requestId: TransitionRequestId;
      routeKey: RouteKey;
      key: string;
    }
  | {
      type: "READINESS_RESOLVED";
      requestId: TransitionRequestId;
      routeKey: RouteKey;
      key: string;
    }
  | {
      type: "READINESS_FAILED";
      requestId: TransitionRequestId;
      routeKey: RouteKey;
      key: string;
      reason: string;
    }
  | {
      type: "NAVIGATION_REQUESTED";
      requestId: TransitionRequestId;
      from: string;
      to: string;
      method: "push" | "replace";
    }
  | { type: "NAVIGATION_DISPATCHED"; requestId: TransitionRequestId }
  | {
      type: "DESTINATION_COMMITTED";
      requestId: TransitionRequestId;
      actualRouteKey: RouteKey;
    }
  | {
      type: "DESTINATION_READY";
      requestId: TransitionRequestId;
      routeKey: RouteKey;
    }
  | {
      type: "DESTINATION_TERMINAL";
      requestId: TransitionRequestId;
      routeKey: RouteKey;
      outcome: "error" | "not-found";
    }
  | { type: "REVEAL_COMPLETED"; requestId: TransitionRequestId }
  | {
      type: "NAVIGATION_SUPERSEDED";
      requestId: TransitionRequestId;
      byRequestId: TransitionRequestId;
    }
  | {
      type: "EMERGENCY_RECOVERY";
      requestId: TransitionRequestId;
      reason: string;
    };

export interface TransitionState {
  phase: TransitionPhase;
  requestId: TransitionRequestId;
  from: string | null;
  target: string | null;
  actualRouteKey: RouteKey | null;
  method: "push" | "replace";
  reason: string | null;
}
