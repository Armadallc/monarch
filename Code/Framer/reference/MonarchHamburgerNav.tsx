/**
 * Shared hamburger nav (portal + admissions dashboard).
 * Framer: cannot import this file from ReferralDashboard — the nav is inlined in ReferralDashboard.tsx for publish.
 * Portal still inlines its own copy until refactored.
 */
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"

const COLORS = {
    ash: "#2B2828",
    ashSubtle: "rgba(43, 40, 40, 0.15)",
    coconut50: "rgba(233, 237, 246, 0.5)",
    tangerine: "#FFA089",
}
const RADIUS = { card: "12px", pill: "100px" }
const FONT = `"Montserrat", sans-serif`
const SHADOWS = { card: "0 2px 12px rgba(43, 40, 40, 0.06)" }

const NAV_BURGER_LINE_W = 22
const NAV_BURGER_LINE_T = 2
const NAV_BURGER_GAP = 5
const NAV_BURGER_SHIFT = NAV_BURGER_GAP + NAV_BURGER_LINE_T
const NAV_MENU_BACKDROP_BLUR = "blur(8px)"
const NAV_MENU_CHROME: React.CSSProperties = {
    background: COLORS.coconut50,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.card,
    boxSizing: "border-box",
    boxShadow: SHADOWS.card,
}
const NAV_MENU_LINK = COLORS.ash
const NAV_MENU_LINK_HOVER = COLORS.tangerine
const NAV_MENU_OFFSET_TOP_PX = 6
const NAV_ROLL_HEIGHT = 38
const NAV_ROLL_DURATION = "0.6s"
const NAV_ROLL_EASE = "cubic-bezier(0.17, 0.79, 0.56, 1)"
const NAV_HOVER_CLOSE_MS = 160
const NAV_MENU_TRANSITION_MS = 280
const NAV_MENU_EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"
const NAV_MENU_EASE_IN = "cubic-bezier(0.4, 0, 0.2, 1)"

const navLinkFont: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 500,
    fontFamily: FONT,
    letterSpacing: "0.4em",
    lineHeight: "2.1em",
    textTransform: "uppercase",
}

export type MonarchNavMenuItem = {
    label: string
    href?: string
    onActivate?: () => void
}

function supportsFineHover(): boolean {
    if (typeof window === "undefined") return false
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches
}

function HamburgerIcon({
    open,
    hoverHamburger,
    reducedMotion,
    canHover,
}: {
    open: boolean
    hoverHamburger: boolean
    reducedMotion: boolean
    canHover: boolean
}) {
    const lineDur = reducedMotion ? "0.01s" : "0.35s"
    const lineEase = "cubic-bezier(0.22, 1, 0.36, 1)"
    const lineBase: React.CSSProperties = {
        display: "block",
        width: NAV_BURGER_LINE_W,
        height: NAV_BURGER_LINE_T,
        background: COLORS.ash,
        borderRadius: 2,
        transformOrigin: "center",
        transition: reducedMotion ? "none" : `transform ${lineDur} ${lineEase}, opacity 0.18s ease`,
    }
    const middleOpacity = open || (hoverHamburger && canHover) ? 0 : 1
    return (
        <>
            <span
                style={{
                    ...lineBase,
                    transform: open ? `translateY(${NAV_BURGER_SHIFT}px) rotate(45deg)` : "translateY(0) rotate(0deg)",
                }}
            />
            <span style={{ ...lineBase, opacity: middleOpacity }} />
            <span
                style={{
                    ...lineBase,
                    transform: open ? `translateY(-${NAV_BURGER_SHIFT}px) rotate(-45deg)` : "translateY(0) rotate(0deg)",
                }}
            />
        </>
    )
}

function RollMenuItem({
    label,
    href,
    onActivate,
    reducedMotion,
}: {
    label: string
    href?: string
    onActivate?: () => void
    reducedMotion: boolean
}) {
    const [hover, setHover] = useState(false)
    const line = (color: string): React.CSSProperties => ({
        height: NAV_ROLL_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        boxSizing: "border-box",
        whiteSpace: "nowrap",
        ...navLinkFont,
        color,
    })
    const inner = reducedMotion ? (
        <span style={line(NAV_MENU_LINK)}>{label}</span>
    ) : (
        <span
            style={{ height: NAV_ROLL_HEIGHT, overflow: "hidden", display: "block", width: "100%" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <span
                style={{
                    display: "block",
                    transform: hover ? `translateY(-${NAV_ROLL_HEIGHT}px)` : "translateY(0)",
                    transition: `transform ${NAV_ROLL_DURATION} ${NAV_ROLL_EASE}`,
                    willChange: "transform",
                }}
            >
                <span style={line(NAV_MENU_LINK)}>{label}</span>
                <span style={line(NAV_MENU_LINK_HOVER)}>{label}</span>
            </span>
        </span>
    )
    const wrapStyle: React.CSSProperties = {
        alignSelf: "flex-end",
        textDecoration: "none",
        color: "inherit",
        width: "100%",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        margin: 0,
        textAlign: "right",
    }
    if (href) {
        return (
            <a href={href} role="menuitem" style={wrapStyle} onClick={onActivate}>
                {inner}
            </a>
        )
    }
    return (
        <button type="button" role="menuitem" style={wrapStyle} onClick={onActivate}>
            {inner}
        </button>
    )
}

function NavMenuOverlay({
    open,
    panelGeo,
    reducedMotion,
    dismissOnPointerDown,
    onDismiss,
    onPanelMouseEnter,
    onPanelMouseLeave,
    onExitComplete,
    children,
}: {
    open: boolean
    panelGeo: { top: number; right: number; minWidth: number }
    reducedMotion: boolean
    dismissOnPointerDown: boolean
    onDismiss: () => void
    onPanelMouseEnter: () => void
    onPanelMouseLeave: () => void
    onExitComplete: () => void
    children: React.ReactNode
}) {
    const [mounted, setMounted] = useState(open)
    const [active, setActive] = useState(false)

    useLayoutEffect(() => {
        if (open) setMounted(true)
    }, [open])

    useEffect(() => {
        if (!mounted) return
        if (reducedMotion) {
            setActive(open)
            if (!open) {
                const t = window.setTimeout(() => {
                    setMounted(false)
                    onExitComplete()
                }, 0)
                return () => window.clearTimeout(t)
            }
            return
        }
        if (open) {
            setActive(false)
            const id = window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => setActive(true))
            })
            return () => window.cancelAnimationFrame(id)
        }
        setActive(false)
        const t = window.setTimeout(() => {
            setMounted(false)
            onExitComplete()
        }, NAV_MENU_TRANSITION_MS)
        return () => window.clearTimeout(t)
    }, [open, mounted, reducedMotion, onExitComplete])

    if (!mounted) return null

    const fadeMs = NAV_MENU_TRANSITION_MS
    const fadeEase = active ? NAV_MENU_EASE_OUT : NAV_MENU_EASE_IN
    const fadeTransition = reducedMotion
        ? undefined
        : `opacity ${fadeMs}ms ${fadeEase}, transform ${fadeMs}ms ${fadeEase}`

    return (
        <>
            <div
                data-monarch-nav-backdrop
                aria-hidden
                role="presentation"
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 1000,
                    background: "transparent",
                    backdropFilter: NAV_MENU_BACKDROP_BLUR,
                    WebkitBackdropFilter: NAV_MENU_BACKDROP_BLUR,
                    pointerEvents: dismissOnPointerDown && active ? "auto" : "none",
                    opacity: active ? 1 : 0,
                    transition: fadeTransition,
                }}
                onMouseDown={
                    dismissOnPointerDown && active
                        ? (e) => {
                              e.stopPropagation()
                              onDismiss()
                          }
                        : undefined
                }
            />
            <div
                data-monarch-nav-menu
                role="menu"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={onPanelMouseEnter}
                onMouseLeave={onPanelMouseLeave}
                style={{
                    position: "fixed",
                    top: panelGeo.top,
                    right: panelGeo.right,
                    minWidth: panelGeo.minWidth,
                    zIndex: 1001,
                    boxSizing: "border-box",
                    overflow: "hidden",
                    transformOrigin: "top right",
                    opacity: active ? 1 : 0,
                    transform: active ? "translateY(0)" : "translateY(-10px)",
                    transition: fadeTransition,
                    pointerEvents: active ? "auto" : "none",
                    ...NAV_MENU_CHROME,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        padding: "20px 24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 14,
                        width: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    {children}
                </div>
            </div>
        </>
    )
}

export function MonarchHamburgerNav({ items }: { items: MonarchNavMenuItem[] }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [canHover, setCanHover] = useState(false)
    const [hoverHamburger, setHoverHamburger] = useState(false)
    const [panelGeo, setPanelGeo] = useState<{ top: number; right: number; minWidth: number } | null>(null)
    const [reducedMotion, setReducedMotion] = useState(false)
    const anchorRef = useRef<HTMLDivElement>(null)
    const hoverCloseRef = useRef<number | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const apply = () => setReducedMotion(mq.matches)
        apply()
        mq.addEventListener("change", apply)
        return () => mq.removeEventListener("change", apply)
    }, [])

    useEffect(() => {
        setCanHover(supportsFineHover())
    }, [])

    const cancelHoverClose = useCallback(() => {
        if (hoverCloseRef.current != null) {
            window.clearTimeout(hoverCloseRef.current)
            hoverCloseRef.current = null
        }
    }, [])

    const closeMenu = useCallback(() => {
        cancelHoverClose()
        setMenuOpen(false)
        setHoverHamburger(false)
    }, [cancelHoverClose])

    const clearPanelGeo = useCallback(() => {
        setPanelGeo(null)
    }, [])

    const measurePanel = useCallback(() => {
        const anchor = anchorRef.current
        if (!anchor || typeof window === "undefined") return
        const r = anchor.getBoundingClientRect()
        setPanelGeo({
            top: r.bottom + NAV_MENU_OFFSET_TOP_PX,
            right: Math.max(0, window.innerWidth - r.right),
            minWidth: Math.max(280, r.width),
        })
    }, [])

    const openMenu = useCallback(() => {
        cancelHoverClose()
        measurePanel()
        setMenuOpen(true)
    }, [cancelHoverClose, measurePanel])

    const scheduleHoverClose = useCallback(() => {
        cancelHoverClose()
        hoverCloseRef.current = window.setTimeout(() => {
            closeMenu()
            hoverCloseRef.current = null
        }, NAV_HOVER_CLOSE_MS)
    }, [cancelHoverClose, closeMenu])

    useLayoutEffect(() => {
        if (!menuOpen) return
        measurePanel()
        window.addEventListener("scroll", measurePanel, true)
        window.addEventListener("resize", measurePanel)
        return () => {
            window.removeEventListener("scroll", measurePanel, true)
            window.removeEventListener("resize", measurePanel)
        }
    }, [menuOpen, measurePanel])

    useEffect(() => () => cancelHoverClose(), [cancelHoverClose])

    useEffect(() => {
        if (!menuOpen) return
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node
            if (anchorRef.current?.contains(t)) return
            if (t instanceof Element && t.closest("[data-monarch-nav-menu]")) return
            if (t instanceof Element && t.closest("[data-monarch-nav-backdrop]")) return
            closeMenu()
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeMenu()
        }
        document.addEventListener("mousedown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousedown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [menuOpen, closeMenu])

    const iconBtn: React.CSSProperties = {
        width: Math.max(44, NAV_BURGER_LINE_W + 24),
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RADIUS.pill,
        border: "none",
        background: "transparent",
        color: COLORS.ash,
        boxSizing: "border-box",
        cursor: "pointer",
        flexShrink: 0,
        flexDirection: "column",
        gap: NAV_BURGER_GAP,
        padding: "4px 0",
        minHeight: 44,
    }

    const menuPortal =
        panelGeo && typeof document !== "undefined"
            ? createPortal(
                  <NavMenuOverlay
                      open={menuOpen}
                      panelGeo={panelGeo}
                      reducedMotion={reducedMotion}
                      dismissOnPointerDown={!canHover}
                      onDismiss={closeMenu}
                      onPanelMouseEnter={cancelHoverClose}
                      onPanelMouseLeave={scheduleHoverClose}
                      onExitComplete={clearPanelGeo}
                  >
                      {items.map((item) => (
                          <RollMenuItem
                              key={item.label}
                              label={item.label}
                              href={item.href}
                              reducedMotion={reducedMotion}
                              onActivate={() => {
                                  closeMenu()
                                  item.onActivate?.()
                              }}
                          />
                      ))}
                  </NavMenuOverlay>,
                  document.body
              )
            : null

    return (
        <>
            {menuPortal}
            <div
                ref={anchorRef}
                style={{
                    position: "relative",
                    zIndex: panelGeo ? 1002 : 1,
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                }}
                onMouseEnter={() => {
                    if (!canHover) return
                    cancelHoverClose()
                    openMenu()
                }}
                onMouseLeave={() => {
                    if (!canHover) return
                    setHoverHamburger(false)
                    scheduleHoverClose()
                }}
            >
                <button
                    type="button"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen ? "true" : "false"}
                    aria-haspopup="menu"
                    onClick={() => {
                        if (canHover) return
                        if (menuOpen) closeMenu()
                        else openMenu()
                    }}
                    onMouseEnter={() => setHoverHamburger(true)}
                    onMouseLeave={() => setHoverHamburger(false)}
                    style={iconBtn}
                >
                    <HamburgerIcon
                        open={menuOpen}
                        hoverHamburger={hoverHamburger}
                        reducedMotion={reducedMotion}
                        canHover={canHover}
                    />
                </button>
            </div>
        </>
    )
}
