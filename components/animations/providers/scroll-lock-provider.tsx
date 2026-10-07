"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react"

type LenisRefLike = { current: { lenis?: { start(): void; stop(): void; resize(): void } } | null }
type ScrollLockContextValue = { acquireScrollLock(owner: string): () => void }

const ScrollLockContext = createContext<ScrollLockContextValue | null>(null)

export function ScrollLockProvider({ children, lenisRef }: { children: ReactNode; lenisRef: LenisRefLike }) {
  const owners = useRef(new Map<string, number>())
  const restore = useRef<{ overflow: string; paddingRight: string } | null>(null)

  const apply = useCallback(() => {
    if (restore.current) return
    restore.current = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight }
    const gap = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    document.body.style.overflow = "hidden"
    if (gap) document.body.style.paddingRight = `${gap}px`
    lenisRef.current?.lenis?.stop()
  }, [lenisRef])

  const clear = useCallback(() => {
    const previous = restore.current
    if (!previous) return
    document.body.style.overflow = previous.overflow
    document.body.style.paddingRight = previous.paddingRight
    restore.current = null
    lenisRef.current?.lenis?.start()
  }, [lenisRef])

  const acquireScrollLock = useCallback((owner: string) => {
    owners.current.set(owner, (owners.current.get(owner) ?? 0) + 1)
    apply()
    let released = false
    return () => {
      if (released) return
      released = true
      const count = owners.current.get(owner) ?? 0
      if (count <= 1) owners.current.delete(owner)
      else owners.current.set(owner, count - 1)
      if (owners.current.size === 0) clear()
    }
  }, [apply, clear])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (!owners.current.has("hidden-document")) owners.current.set("hidden-document", 1)
        apply()
      } else {
        owners.current.delete("hidden-document")
        if (owners.current.size === 0) clear()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [apply, clear])

  useEffect(() => () => clear(), [clear])
  const value = useMemo(() => ({ acquireScrollLock }), [acquireScrollLock])
  return <ScrollLockContext.Provider value={value}>{children}</ScrollLockContext.Provider>
}

export function useScrollLock() {
  const context = useContext(ScrollLockContext)
  if (!context) throw new Error("useScrollLock must be used within ScrollLockProvider")
  return context
}

export function ModalScrollLockBridge({ owner }: { owner: string }) {
  const { acquireScrollLock } = useScrollLock()
  useEffect(() => acquireScrollLock(owner), [acquireScrollLock, owner])
  return null
}
