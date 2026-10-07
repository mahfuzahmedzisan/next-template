"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { ScrollTrigger } from "@/components/animations/gsap";
import {
  initialTransitionState,
  transitionReducer,
} from "@/lib/transitions/reducer";

import { NavigationProgress } from "./navigation-progress";

const DEADLINE_MS = 12_000;
const NAVIGATION_ATTRIBUTE = "data-navigation-progress-active";

type NavigateOptions = { replace?: boolean; scroll?: boolean };
type Outcome = "ready" | "error" | "not-found";
type TransitionContextValue = {
  navigate(href: string, options?: NavigateOptions): void;
  markReady(routeKey: string, key: string, outcome?: Outcome): () => void;
  runTransitionAction(action: () => void | Promise<void>): Promise<void>;
  active: boolean;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

function routeKey(value: string) {
  try {
    return new URL(value, window.location.href).pathname;
  } catch {
    return value.split(/[?#]/)[0];
  }
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, dispatch] = useReducer(
    transitionReducer,
    initialTransitionState,
  );
  const requestCounter = useRef(0);
  const readyRoutes = useRef(new Map<string, Outcome>());
  const pendingActionRequest = useRef<number | null>(null);
  const activeTarget = useRef<string | null>(null);
  const active = state.phase !== "idle";

  useEffect(() => {
    if (state.phase !== "routeWaiting") return;
    if (
      pendingActionRequest.current === state.requestId &&
      pathname === state.from
    )
      return;
    if (
      pendingActionRequest.current === state.requestId &&
      pathname !== state.from
    )
      pendingActionRequest.current = null;
    if (
      pathname === state.from &&
      routeKey(state.target ?? pathname) !== pathname
    )
      return;
    dispatch({
      type: "DESTINATION_COMMITTED",
      requestId: state.requestId,
      actualRouteKey: pathname,
    });
    const outcome = readyRoutes.current.get(pathname);
    if (outcome === "ready")
      dispatch({
        type: "DESTINATION_READY",
        requestId: state.requestId,
        routeKey: pathname,
      });
    else if (outcome)
      dispatch({
        type: "DESTINATION_TERMINAL",
        requestId: state.requestId,
        routeKey: pathname,
        outcome,
      });
  }, [pathname, state.from, state.phase, state.requestId, state.target]);

  useEffect(() => {
    return () => document.documentElement.removeAttribute(NAVIGATION_ATTRIBUTE);
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => {
      performance.mark("route-transition-recovery");
      dispatch({
        type: "EMERGENCY_RECOVERY",
        requestId: state.requestId,
        reason: "deadline",
      });
    }, DEADLINE_MS);
    return () => window.clearTimeout(id);
  }, [active, state.requestId]);

  const navigate = useCallback(
    (href: string, options: NavigateOptions = {}) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.assign(url.href);
        return;
      }
      const samePath = url.pathname === window.location.pathname;
      if (samePath) {
        if (options.replace)
          router.replace(`${url.pathname}${url.search}${url.hash}`, options);
        else router.push(`${url.pathname}${url.search}${url.hash}`, options);
        return;
      }
      const destination = `${url.pathname}${url.search}${url.hash}`;
      if (activeTarget.current === destination) return;
      const requestId = ++requestCounter.current;
      activeTarget.current = destination;
      readyRoutes.current.delete(url.pathname);
      document.documentElement.setAttribute(
        NAVIGATION_ATTRIBUTE,
        String(requestId),
      );
      dispatch({
        type: "NAVIGATION_REQUESTED",
        requestId,
        from: pathname,
        to: destination,
        method: options.replace ? "replace" : "push",
      });
      if (options.replace)
        router.replace(destination, { scroll: options.scroll });
      else router.push(destination, { scroll: options.scroll });
      dispatch({ type: "NAVIGATION_DISPATCHED", requestId });
    },
    [pathname, router],
  );

  const markReady = useCallback(
    (key: string, _registration: string, outcome: Outcome = "ready") => {
      readyRoutes.current.set(key, outcome);
      const current =
        state.actualRouteKey ?? routeKey(state.target ?? pathname);
      if (state.phase === "routeWaiting" && current === key) {
        if (outcome === "ready")
          dispatch({
            type: "DESTINATION_READY",
            requestId: state.requestId,
            routeKey: key,
          });
        else
          dispatch({
            type: "DESTINATION_TERMINAL",
            requestId: state.requestId,
            routeKey: key,
            outcome,
          });
      }
      return () => {
        if (readyRoutes.current.get(key) === outcome)
          readyRoutes.current.delete(key);
      };
    },
    [
      pathname,
      state.actualRouteKey,
      state.phase,
      state.requestId,
      state.target,
    ],
  );

  const onProgressFinished = useCallback(() => {
    if (
      document.documentElement.getAttribute(NAVIGATION_ATTRIBUTE) ===
      String(state.requestId)
    ) {
      document.documentElement.removeAttribute(NAVIGATION_ATTRIBUTE);
    }
    activeTarget.current = null;
    if (pendingActionRequest.current === state.requestId)
      pendingActionRequest.current = null;
    dispatch({ type: "REVEAL_COMPLETED", requestId: state.requestId });
    requestAnimationFrame(() => {
      document.getElementById("content")?.focus({ preventScroll: true });
      ScrollTrigger.refresh();
    });
  }, [state.requestId]);

  const runTransitionAction = useCallback(
    async (action: () => void | Promise<void>) => {
      const requestId = ++requestCounter.current;
      pendingActionRequest.current = requestId;
      activeTarget.current = pathname;
      document.documentElement.setAttribute(
        NAVIGATION_ATTRIBUTE,
        String(requestId),
      );
      dispatch({
        type: "NAVIGATION_REQUESTED",
        requestId,
        from: pathname,
        to: pathname,
        method: "push",
      });
      dispatch({ type: "NAVIGATION_DISPATCHED", requestId });
      await action();
    },
    [pathname],
  );

  const value = useMemo(
    () => ({ navigate, markReady, runTransitionAction, active }),
    [active, markReady, navigate, runTransitionAction],
  );
  return (
    <TransitionContext.Provider value={value}>
      {children}
      <NavigationProgress
        key={state.requestId}
        phase={state.phase}
        onFinished={onProgressFinished}
      />
    </TransitionContext.Provider>
  );
}

export function useTransitionController() {
  const context = useContext(TransitionContext);
  if (!context)
    throw new Error("Transition components must be inside TransitionProvider");
  return context;
}

export function useTransitionRouter() {
  const router = useRouter();
  const { navigate } = useTransitionController();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: { scroll?: boolean }) =>
        navigate(href, { ...options, replace: false }),
      replace: (href: string, options?: { scroll?: boolean }) =>
        navigate(href, { ...options, replace: true }),
    }),
    [navigate, router],
  );
}
