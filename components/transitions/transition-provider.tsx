"use client"

import { usePathname, useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react"

import { ScrollTrigger } from "@/components/animations/gsap"
import { useScrollLock } from "@/components/animations/providers/scroll-lock-provider"
import { initialTransitionState, transitionReducer } from "@/lib/transitions/reducer"

import { activateInteractionShield } from "./interaction-shield"
import { TransitionOverlay } from "./transition-overlay"

const SPLASH_KEY = "mahfuz:splash:v1"
const DEADLINE_MS = 12_000

type NavigateOptions = { replace?: boolean; scroll?: boolean }
type Outcome = "ready" | "error" | "not-found"
type TransitionContextValue = {
  navigate(href: string, options?: NavigateOptions): void
  markReady(routeKey: string, key: string, outcome?: Outcome): () => void
  runTransitionAction(action: () => void | Promise<void>): Promise<void>
  active: boolean
}

const TransitionContext = createContext<TransitionContextValue | null>(null)

function routeKey(value: string) {
  try { return new URL(value, window.location.href).pathname } catch { return value.split(/[?#]/)[0] }
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { acquireScrollLock } = useScrollLock()
  const [state, dispatch] = useReducer(transitionReducer, initialTransitionState)
  const requestCounter = useRef(0)
  const booted = useRef(false)
  const readyRoutes = useRef(new Map<string, Outcome>())
  const actionRef = useRef<(() => void | Promise<void>) | null>(null)
  const layerRef = useRef<HTMLElement | null>(null)
  const active = state.phase !== "idle" && state.phase !== "booting"

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    const shouldSplash = document.documentElement.dataset.splashActive === "true"
    if (shouldSplash) {
      dispatch({ type: "NAVIGATION_REQUESTED", requestId: 0, from: pathname, to: pathname, method: "push" })
      dispatch({ type: "COVER_COMPLETED", requestId: 0 })
      dispatch({ type: "NAVIGATION_DISPATCHED", requestId: 0 })
    } else {
      dispatch({ type: "REVEAL_COMPLETED", requestId: 0 })
    }
  }, [pathname]) // Hydration adopts the server-rendered overlay exactly once.

  useEffect(() => {
    if (state.requestId === 0 && state.phase === "routeWaiting") {
      if (readyRoutes.current.has(pathname)) dispatch({ type: "DESTINATION_READY", requestId: 0, routeKey: pathname })
      return
    }
    if (state.phase !== "routeWaiting" || state.requestId === 0) return
    if (pathname === state.from && routeKey(state.target ?? pathname) !== pathname) return
    dispatch({ type: "DESTINATION_COMMITTED", requestId: state.requestId, actualRouteKey: pathname })
    const outcome = readyRoutes.current.get(pathname)
    if (outcome === "ready") dispatch({ type: "DESTINATION_READY", requestId: state.requestId, routeKey: pathname })
    else if (outcome) dispatch({ type: "DESTINATION_TERMINAL", requestId: state.requestId, routeKey: pathname, outcome })
  }, [pathname, state.from, state.phase, state.requestId, state.target])

  useEffect(() => {
    if (!active) return
    const releaseScroll = acquireScrollLock("route-transition")
    const layer = document.querySelector<HTMLElement>("[data-transition-layer]")
    layerRef.current = layer
    const releaseShield = layer ? activateInteractionShield(layer) : () => {}
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (focused && focused.closest("[inert]")) document.querySelector<HTMLElement>(".transition-status")?.focus({ preventScroll: true })
    return () => { releaseShield(); releaseScroll() }
  }, [active, acquireScrollLock])

  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(() => {
      performance.mark("route-transition-recovery")
      dispatch({ type: "EMERGENCY_RECOVERY", requestId: state.requestId, reason: "deadline" })
    }, DEADLINE_MS)
    return () => window.clearTimeout(id)
  }, [active, state.requestId])

  const navigate = useCallback((href: string, options: NavigateOptions = {}) => {
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin) { window.location.assign(url.href); return }
    const samePath = url.pathname === window.location.pathname
    if (samePath) {
      if (options.replace) router.replace(`${url.pathname}${url.search}${url.hash}`, options)
      else router.push(`${url.pathname}${url.search}${url.hash}`, options)
      return
    }
    const requestId = ++requestCounter.current
    readyRoutes.current.delete(url.pathname)
    dispatch({ type: "NAVIGATION_REQUESTED", requestId, from: pathname, to: `${url.pathname}${url.search}${url.hash}`, method: options.replace ? "replace" : "push" })
  }, [pathname, router])

  const markReady = useCallback((key: string, _registration: string, outcome: Outcome = "ready") => {
    readyRoutes.current.set(key, outcome)
    const current = state.actualRouteKey ?? routeKey(state.target ?? pathname)
    if (state.phase === "routeWaiting" && current === key) {
      if (outcome === "ready") dispatch({ type: "DESTINATION_READY", requestId: state.requestId, routeKey: key })
      else dispatch({ type: "DESTINATION_TERMINAL", requestId: state.requestId, routeKey: key, outcome })
    }
    return () => { if (readyRoutes.current.get(key) === outcome) readyRoutes.current.delete(key) }
  }, [pathname, state.actualRouteKey, state.phase, state.requestId, state.target])

  const onCovered = useCallback(() => {
    const requestId = state.requestId
    dispatch({ type: "COVER_COMPLETED", requestId })
    if (actionRef.current) {
      const action = actionRef.current
      actionRef.current = null
      Promise.resolve(action()).finally(() => dispatch({ type: "NAVIGATION_DISPATCHED", requestId }))
      return
    }
    if (!state.target) return
    const options = { scroll: true }
    if (state.method === "replace") router.replace(state.target, options)
    else router.push(state.target, options)
    dispatch({ type: "NAVIGATION_DISPATCHED", requestId })
  }, [router, state.method, state.requestId, state.target])

  const onRevealed = useCallback(() => {
    document.documentElement.removeAttribute("data-splash-active")
    if (state.requestId === 0) {
      try { sessionStorage.setItem(SPLASH_KEY, "shown") } catch {}
    }
    dispatch({ type: "REVEAL_COMPLETED", requestId: state.requestId })
    requestAnimationFrame(() => {
      document.getElementById("content")?.focus({ preventScroll: true })
      ScrollTrigger.refresh()
    })
  }, [state.requestId])

  const runTransitionAction = useCallback(async (action: () => void | Promise<void>) => {
    const requestId = ++requestCounter.current
    actionRef.current = action
    dispatch({ type: "NAVIGATION_REQUESTED", requestId, from: pathname, to: pathname, method: "push" })
  }, [pathname])

  const value = useMemo(() => ({ navigate, markReady, runTransitionAction, active }), [active, markReady, navigate, runTransitionAction])
  return (
    <TransitionContext.Provider value={value}>
      {children}
      <TransitionOverlay initial={state.requestId === 0} phase={state.requestId === 0 && state.phase === "routeWaiting" ? "splashWaiting" : state.requestId === 0 && state.phase === "routeRevealing" ? "splashRevealing" : state.phase} onCovered={onCovered} onRevealed={onRevealed} />
    </TransitionContext.Provider>
  )
}

export function useTransitionController() {
  const context = useContext(TransitionContext)
  if (!context) throw new Error("Transition components must be inside TransitionProvider")
  return context
}

export function useTransitionRouter() {
  const router = useRouter()
  const { navigate } = useTransitionController()
  return useMemo(() => ({ ...router, push: (href: string, options?: { scroll?: boolean }) => navigate(href, { ...options, replace: false }), replace: (href: string, options?: { scroll?: boolean }) => navigate(href, { ...options, replace: true }) }), [navigate, router])
}
