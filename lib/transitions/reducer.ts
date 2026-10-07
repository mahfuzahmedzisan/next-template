import type { TransitionEvent, TransitionState } from "./types";

export const initialTransitionState: TransitionState = {
  phase: "idle",
  requestId: 0,
  from: null,
  target: null,
  actualRouteKey: null,
  method: "push",
  reason: null,
};

export function transitionReducer(
  state: TransitionState,
  event: TransitionEvent,
): TransitionState {
  if (event.requestId < state.requestId) return state;
  switch (event.type) {
    case "NAVIGATION_REQUESTED":
      return {
        ...state,
        phase: "navigationDispatched",
        requestId: event.requestId,
        from: event.from,
        target: event.to,
        actualRouteKey: null,
        method: event.method,
        reason: null,
      };
    case "NAVIGATION_SUPERSEDED":
      return event.requestId === state.requestId
        ? { ...state, requestId: event.byRequestId }
        : state;
    case "NAVIGATION_DISPATCHED":
      return event.requestId === state.requestId
        ? { ...state, phase: "routeWaiting" }
        : state;
    case "DESTINATION_COMMITTED":
      return event.requestId === state.requestId
        ? { ...state, actualRouteKey: event.actualRouteKey }
        : state;
    case "DESTINATION_READY":
    case "DESTINATION_TERMINAL":
      return event.requestId === state.requestId
        ? { ...state, phase: "routeRevealing" }
        : state;
    case "REVEAL_COMPLETED":
      return event.requestId === state.requestId
        ? {
            ...state,
            phase: "idle",
            from: null,
            target: null,
            actualRouteKey: null,
            reason: null,
          }
        : state;
    case "EMERGENCY_RECOVERY":
      return event.requestId === state.requestId
        ? { ...state, phase: "recovering", reason: event.reason }
        : state;
    default:
      return state;
  }
}
