// Nav Burger — familiar hamburger + dropdown; mimics NAV LINK ASH roll animation.
// Paste into Framer as a code component. Place under Cred Span (relative) or fixed to viewport.
// URLs: prefer full paths, e.g. /resources#pdf-resources for cross-page sections.
//
// If the dropdown is invisible on hover: parent Frames often use Clip content (overflow:hidden).
// Turn off Clip on "NavBurger Wrapper", or enable "Detach panel" (renders the menu into document.body).

import * as React from "react"
import { createPortal } from "react-dom"
import {
    addPropertyControls,
    ControlType,
    RenderTarget,
} from "framer"
import { motion, AnimatePresence } from "framer-motion"

/** NAV LINK ASH roll timing */
const ROLL_DURATION_SEC = 0.6
const ROLL_EASE: [number, number, number, number] = [0.17, 0.79, 0.56, 1]

type Align = "start" | "center" | "end"
type RootPosition = "relative" | "absolute" | "fixed"

type NavBurgerProps = {
    /** Root layout */
    rootPosition: RootPosition
    rootTop: string
    rootRight: string
    rootLeft: string
    rootZIndex: number

    /** Scroll: hide on scroll down, show on scroll up (like many sticky navs) */
    enableScrollReveal: boolean
    scrollThresholdPx: number
    scrollHideOffsetPx: number

    /** Menu shell */
    menuFillEnabled: boolean
    menuBackgroundColor: string
    menuOpacity: number
    menuBlurPx: number
    menuBorderRadius: string
    menuPadding: string
    menuBorderColor: string
    menuBorderWidth: number
    menuZIndex: number
    menuOffsetTopPx: number

    /** Backdrop (click-outside on touch; optional on desktop) */
    backdropEnabled: boolean
    backdropOnDesktop: boolean
    backdropColor: string
    backdropZIndex: number

    /**
     * Render the dropdown via portal to document.body so ancestor overflow:hidden cannot clip it.
     * Desktop hover uses a short delay when moving from the icon to the panel.
     */
    detachPanelToBody: boolean

    /** Links */
    linksAlign: Align
    linksGap: number
    rollHeight: number
    /** Framer Font control, or switch to Manual for family / size / weight fields */
    linkTypographyMode: "framer" | "manual"
    linkFont?: React.CSSProperties
    linkManualFontFamily: string
    linkManualFontSize: number
    linkManualFontWeight: number
    linkManualFontStyle: "normal" | "italic"
    linkManualLetterSpacing: string
    linkManualLineHeight: string
    linkManualTextTransform: "none" | "uppercase" | "lowercase" | "capitalize"
    linkColor: string
    linkHoverColor: string

    /** Contact */
    showPhone: boolean
    phoneLabel: string
    phoneHref: string
    showEmail: boolean
    emailLabel: string
    emailHref: string

    /** Up to 7 nav links */
    showLink1: boolean
    link1Label: string
    link1Url: string
    showLink2: boolean
    link2Label: string
    link2Url: string
    showLink3: boolean
    link3Label: string
    link3Url: string
    showLink4: boolean
    link4Label: string
    link4Url: string
    showLink5: boolean
    link5Label: string
    link5Url: string
    showLink6: boolean
    link6Label: string
    link6Url: string
    showLink7: boolean
    link7Label: string
    link7Url: string

    /** Hamburger (all three lines; optional different color when open → X) */
    hamburgerLineColor: string
    hamburgerLineColorOpen?: string
    hamburgerLineThickness: number
    hamburgerLineWidth: number
    hamburgerGap: number
    hamburgerPadding: string

    style?: React.CSSProperties
}

/** Canvas / thumbnail / export: no real window scroll — skip scroll-reveal listeners. */
function isFramerNonPreviewTarget(): boolean {
    try {
        const t = RenderTarget.current()
        return (
            t === RenderTarget.canvas ||
            t === RenderTarget.thumbnail ||
            t === RenderTarget.export
        )
    } catch {
        return false
    }
}

function supportsFineHover(): boolean {
    if (typeof window === "undefined") return false
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches
}

function prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function alignToFlex(align: Align): React.CSSProperties["alignItems"] {
    if (align === "start") return "flex-start"
    if (align === "end") return "flex-end"
    return "center"
}

function alignToJustify(align: Align): React.CSSProperties["justifyContent"] {
    if (align === "start") return "flex-start"
    if (align === "end") return "flex-end"
    return "center"
}

function RollNavLink({
    href,
    label,
    linkFont,
    color,
    hoverColor,
    rollHeight,
    align,
    reducedMotion,
}: {
    href: string
    label: string
    linkFont: React.CSSProperties
    color: string
    hoverColor: string
    rollHeight: number
    align: Align
    reducedMotion: boolean
}) {
    const [hover, setHover] = React.useState(false)
    const justify = alignToJustify(align)
    const alignSelf =
        align === "start"
            ? ("flex-start" as const)
            : align === "end"
              ? ("flex-end" as const)
              : ("center" as const)

    const lineStyle = (c: string): React.CSSProperties => ({
        height: rollHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        boxSizing: "border-box",
        whiteSpace: "nowrap",
        ...linkFont,
        color: c,
    })

    return (
        <a
            href={href || "#"}
            style={{
                alignSelf,
                textDecoration: "none",
                color: "inherit",
                maxWidth: "100%",
            }}
        >
            {reducedMotion ? (
                <div style={lineStyle(color)}>{label}</div>
            ) : (
                <div
                    style={{
                        height: rollHeight,
                        overflow: "hidden",
                        display: "block",
                    }}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                >
                    <motion.div
                        animate={{ y: hover ? -rollHeight : 0 }}
                        transition={{
                            duration: ROLL_DURATION_SEC,
                            ease: ROLL_EASE,
                        }}
                        style={{ willChange: "transform" }}
                    >
                        <div style={lineStyle(color)}>{label}</div>
                        <div style={lineStyle(hoverColor)}>{label}</div>
                    </motion.div>
                </div>
            )}
        </a>
    )
}

/**
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 48
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function NavBurger(props: NavBurgerProps) {
    const {
        rootPosition,
        rootTop,
        rootRight,
        rootLeft,
        rootZIndex,
        enableScrollReveal,
        scrollThresholdPx,
        scrollHideOffsetPx,
        menuFillEnabled,
        menuBackgroundColor,
        menuOpacity,
        menuBlurPx,
        menuBorderRadius,
        menuPadding,
        menuBorderColor,
        menuBorderWidth,
        menuZIndex,
        menuOffsetTopPx,
        backdropEnabled,
        backdropOnDesktop,
        backdropColor,
        backdropZIndex,
        detachPanelToBody,
        linksAlign,
        linksGap,
        rollHeight,
        linkTypographyMode,
        linkFont,
        linkManualFontFamily,
        linkManualFontSize,
        linkManualFontWeight,
        linkManualFontStyle,
        linkManualLetterSpacing,
        linkManualLineHeight,
        linkManualTextTransform,
        linkColor,
        linkHoverColor,
        showPhone,
        phoneLabel,
        phoneHref,
        showEmail,
        emailLabel,
        emailHref,
        showLink1,
        link1Label,
        link1Url,
        showLink2,
        link2Label,
        link2Url,
        showLink3,
        link3Label,
        link3Url,
        showLink4,
        link4Label,
        link4Url,
        showLink5,
        link5Label,
        link5Url,
        showLink6,
        link6Label,
        link6Url,
        showLink7,
        link7Label,
        link7Url,
        hamburgerLineColor,
        hamburgerLineColorOpen,
        hamburgerLineThickness,
        hamburgerLineWidth,
        hamburgerGap,
        hamburgerPadding,
        style,
    } = props

    const isStatic = isFramerNonPreviewTarget()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const panelRef = React.useRef<HTMLDivElement | null>(null)
    const hoverCloseTimerRef = React.useRef<number | null>(null)
    const [panelGeo, setPanelGeo] = React.useState<{
        top: number
        left: number
        width: number
    } | null>(null)
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [hoverHamburger, setHoverHamburger] = React.useState(false)
    const [barVisible, setBarVisible] = React.useState(true)
    const [canHover, setCanHover] = React.useState(false)
    const [reducedMotion, setReducedMotion] = React.useState(false)

    const lastScrollY = React.useRef(0)

    const navItems = React.useMemo(() => {
        const rows: { label: string; url: string }[] = []
        const push = (show: boolean, label: string, url: string) => {
            if (!show || !label.trim()) return
            rows.push({ label: label.trim(), url: url.trim() || "#" })
        }
        push(showLink1, link1Label, link1Url)
        push(showLink2, link2Label, link2Url)
        push(showLink3, link3Label, link3Url)
        push(showLink4, link4Label, link4Url)
        push(showLink5, link5Label, link5Url)
        push(showLink6, link6Label, link6Url)
        push(showLink7, link7Label, link7Url)
        return rows
    }, [
        showLink1,
        link1Label,
        link1Url,
        showLink2,
        link2Label,
        link2Url,
        showLink3,
        link3Label,
        link3Url,
        showLink4,
        link4Label,
        link4Url,
        showLink5,
        link5Label,
        link5Url,
        showLink6,
        link6Label,
        link6Url,
        showLink7,
        link7Label,
        link7Url,
    ])

    const resolvedLinkFont = React.useMemo((): React.CSSProperties => {
        if (linkTypographyMode === "manual") {
            const s: React.CSSProperties = {}
            const ff = linkManualFontFamily.trim()
            if (ff) s.fontFamily = ff
            if (linkManualFontSize > 0) s.fontSize = linkManualFontSize
            if (linkManualFontWeight >= 100 && linkManualFontWeight <= 900) {
                s.fontWeight = linkManualFontWeight
            }
            if (linkManualFontStyle === "italic") {
                s.fontStyle = "italic"
            }
            const ls = linkManualLetterSpacing.trim()
            if (ls) s.letterSpacing = ls
            const lh = linkManualLineHeight.trim()
            if (lh) s.lineHeight = lh
            s.textTransform = linkManualTextTransform
            return s
        }
        return { ...(linkFont ?? {}) }
    }, [
        linkTypographyMode,
        linkFont,
        linkManualFontFamily,
        linkManualFontSize,
        linkManualFontWeight,
        linkManualFontStyle,
        linkManualLetterSpacing,
        linkManualLineHeight,
        linkManualTextTransform,
    ])

    const hamburgerResolvedLineColor =
        menuOpen &&
        hamburgerLineColorOpen != null &&
        String(hamburgerLineColorOpen).trim() !== ""
            ? hamburgerLineColorOpen
            : hamburgerLineColor

    React.useEffect(() => {
        setCanHover(supportsFineHover())
        setReducedMotion(prefersReducedMotion())
    }, [])

    React.useEffect(() => {
        if (!enableScrollReveal || isStatic) {
            setBarVisible(true)
            return
        }

        lastScrollY.current =
            typeof window !== "undefined" ? window.scrollY || 0 : 0

        const onScroll = () => {
            const y = window.scrollY || document.documentElement.scrollTop
            const delta = y - lastScrollY.current
            lastScrollY.current = y

            if (y <= scrollThresholdPx) {
                setBarVisible(true)
                return
            }
            if (delta > 6) {
                setBarVisible(false)
                setMenuOpen(false)
            } else if (delta < -6) {
                setBarVisible(true)
            }
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [enableScrollReveal, isStatic, scrollThresholdPx])

    React.useEffect(() => {
        if (!menuOpen || canHover) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [menuOpen, canHover])

    React.useEffect(() => {
        if (!menuOpen || canHover) return
        const onDown = (e: MouseEvent) => {
            const el = rootRef.current
            const panelEl = panelRef.current
            if (!el || !(e.target instanceof Node)) return
            const inRoot = el.contains(e.target)
            const inPanel = panelEl?.contains(e.target) ?? false
            if (!inRoot && !inPanel) setMenuOpen(false)
        }
        document.addEventListener("mousedown", onDown)
        return () => document.removeEventListener("mousedown", onDown)
    }, [menuOpen, canHover])

    const cancelHoverClose = React.useCallback(() => {
        if (hoverCloseTimerRef.current != null) {
            window.clearTimeout(hoverCloseTimerRef.current)
            hoverCloseTimerRef.current = null
        }
    }, [])

    const openMenu = React.useCallback(() => {
        if (detachPanelToBody) {
            const root = rootRef.current
            if (root) {
                const r = root.getBoundingClientRect()
                setPanelGeo({
                    top: r.bottom + menuOffsetTopPx,
                    left: r.left,
                    width: r.width,
                })
            }
        }
        setMenuOpen(true)
    }, [detachPanelToBody, menuOffsetTopPx])
    const closeMenu = React.useCallback(() => {
        cancelHoverClose()
        setMenuOpen(false)
    }, [cancelHoverClose])
    const toggleMenu = React.useCallback(() => {
        cancelHoverClose()
        setMenuOpen((o) => !o)
    }, [cancelHoverClose])

    const scheduleHoverClose = React.useCallback(() => {
        cancelHoverClose()
        hoverCloseTimerRef.current = window.setTimeout(() => {
            setMenuOpen(false)
            setHoverHamburger(false)
            hoverCloseTimerRef.current = null
        }, 140)
    }, [cancelHoverClose])

    React.useEffect(() => () => cancelHoverClose(), [cancelHoverClose])

    React.useLayoutEffect(() => {
        if (!menuOpen || !detachPanelToBody) {
            setPanelGeo(null)
            return
        }
        const measure = () => {
            const root = rootRef.current
            if (!root) return
            const r = root.getBoundingClientRect()
            setPanelGeo({
                top: r.bottom + menuOffsetTopPx,
                left: r.left,
                width: r.width,
            })
        }
        measure()
        window.addEventListener("scroll", measure, true)
        window.addEventListener("resize", measure)
        return () => {
            window.removeEventListener("scroll", measure, true)
            window.removeEventListener("resize", measure)
        }
    }, [menuOpen, detachPanelToBody, menuOffsetTopPx])

    const onRootMouseEnter = React.useCallback(() => {
        if (!canHover) return
        if (detachPanelToBody) cancelHoverClose()
        openMenu()
    }, [canHover, detachPanelToBody, cancelHoverClose, openMenu])

    const onRootMouseLeave = React.useCallback(() => {
        if (!canHover) return
        setHoverHamburger(false)
        if (detachPanelToBody) scheduleHoverClose()
        else closeMenu()
    }, [canHover, detachPanelToBody, scheduleHoverClose, closeMenu])

    const showBackdrop =
        menuOpen &&
        backdropEnabled &&
        (!canHover || backdropOnDesktop)

    const shift = hamburgerGap + hamburgerLineThickness
    const spring = reducedMotion
        ? { duration: 0.01 }
        : { type: "spring" as const, stiffness: 420, damping: 32 }

    /** Panel fill: solid when Menu fill on; transparent when off (blur still applies to chrome layer). */
    const chromeBackground = menuFillEnabled
        ? menuBackgroundColor
        : "transparent"

    const panelPositionStyle: React.CSSProperties =
        detachPanelToBody && panelGeo
            ? {
                  position: "fixed",
                  top: panelGeo.top,
                  left: panelGeo.left,
                  width: panelGeo.width,
                  marginTop: 0,
              }
            : {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "100%",
                  marginTop: menuOffsetTopPx,
                  width: "100%",
              }

    const showMenuPanel =
        menuOpen && (!detachPanelToBody || panelGeo != null)

    const rootPositionStyle: React.CSSProperties =
        rootPosition === "fixed" || rootPosition === "absolute"
            ? {
                  position: rootPosition,
                  top: rootTop,
                  left: rootLeft,
                  right: rootRight,
                  zIndex: rootZIndex,
              }
            : {
                  position: "relative",
                  zIndex: rootZIndex,
              }

    const dropdownPanel = showMenuPanel ? (
        <motion.div
            key="panel"
            ref={panelRef}
            initial={
                reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }
            }
            transition={
                reducedMotion
                    ? { duration: 0.12 }
                    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
            }
            onMouseEnter={
                detachPanelToBody && canHover
                    ? cancelHoverClose
                    : undefined
            }
            onMouseLeave={
                detachPanelToBody && canHover
                    ? scheduleHoverClose
                    : undefined
            }
            style={{
                ...panelPositionStyle,
                zIndex: menuZIndex,
                boxSizing: "border-box",
                borderRadius: menuBorderRadius,
                overflow: "hidden",
                pointerEvents: "auto",
            }}
        >
            {/*
              Chrome layer: opacity/blur/background live here so Framer Motion's
              animate={{ opacity: 1 }} on the wrapper does not override Menu opacity.
              Links stay fully opaque in the content layer below.
            */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: menuBorderRadius,
                    border: `${menuBorderWidth}px solid ${menuBorderColor}`,
                    background: chromeBackground,
                    opacity: menuOpacity,
                    backdropFilter:
                        menuBlurPx > 0
                            ? `blur(${menuBlurPx}px)`
                            : undefined,
                    WebkitBackdropFilter:
                        menuBlurPx > 0
                            ? `blur(${menuBlurPx}px)`
                            : undefined,
                    boxShadow:
                        menuFillEnabled || menuBorderWidth > 0
                            ? "0 12px 40px rgba(0,0,0,0.12)"
                            : undefined,
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    padding: menuPadding,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: alignToFlex(linksAlign),
                    gap: linksGap,
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                {navItems.map((item, i) => (
                    <RollNavLink
                        key={`${item.url}-${i}`}
                        href={item.url}
                        label={item.label}
                        linkFont={resolvedLinkFont}
                        color={linkColor}
                        hoverColor={linkHoverColor}
                        rollHeight={rollHeight}
                        align={linksAlign}
                        reducedMotion={reducedMotion}
                    />
                ))}
                {showPhone && phoneLabel.trim() ? (
                    <RollNavLink
                        href={phoneHref.trim() || "tel:"}
                        label={phoneLabel.trim()}
                        linkFont={resolvedLinkFont}
                        color={linkColor}
                        hoverColor={linkHoverColor}
                        rollHeight={rollHeight}
                        align={linksAlign}
                        reducedMotion={reducedMotion}
                    />
                ) : null}
                {showEmail && emailLabel.trim() ? (
                    <RollNavLink
                        href={emailHref.trim() || "mailto:"}
                        label={emailLabel.trim()}
                        linkFont={resolvedLinkFont}
                        color={linkColor}
                        hoverColor={linkHoverColor}
                        rollHeight={rollHeight}
                        align={linksAlign}
                        reducedMotion={reducedMotion}
                    />
                ) : null}
            </div>
        </motion.div>
    ) : null

    return (
        <>
            <motion.div
                ref={rootRef}
                style={{
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "visible",
                    ...rootPositionStyle,
                    ...style,
                }}
                animate={
                    enableScrollReveal && !isStatic
                        ? {
                              y: barVisible ? 0 : -scrollHideOffsetPx,
                              opacity: barVisible ? 1 : 0,
                          }
                        : { y: 0, opacity: 1 }
                }
                transition={
                    reducedMotion
                        ? { duration: 0.15 }
                        : { type: "spring", stiffness: 320, damping: 34 }
                }
                onMouseEnter={onRootMouseEnter}
                onMouseLeave={onRootMouseLeave}
            >
                <div
                    style={{
                        width: "100%",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        overflow: "visible",
                    }}
                >
                    <motion.button
                        type="button"
                        aria-expanded={menuOpen}
                        aria-label={
                            menuOpen ? "Close navigation menu" : "Open navigation menu"
                        }
                        onClick={() => {
                            if (!canHover || isStatic) toggleMenu()
                        }}
                        onMouseEnter={() => setHoverHamburger(true)}
                        onMouseLeave={() => setHoverHamburger(false)}
                        style={{
                            alignSelf:
                                linksAlign === "end"
                                    ? "flex-end"
                                    : linksAlign === "center"
                                      ? "center"
                                      : "flex-start",
                            padding: hamburgerPadding,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: hamburgerGap,
                            width: Math.max(44, hamburgerLineWidth + 24),
                            minHeight: 44,
                            boxSizing: "border-box",
                        }}
                    >
                        <motion.span
                            style={{
                                display: "block",
                                width: hamburgerLineWidth,
                                height: hamburgerLineThickness,
                                background: hamburgerResolvedLineColor,
                                borderRadius: 2,
                                transformOrigin: "center",
                            }}
                            animate={
                                reducedMotion
                                    ? {}
                                    : {
                                          y: menuOpen ? shift : 0,
                                          rotate: menuOpen ? 45 : 0,
                                      }
                            }
                            transition={spring}
                        />
                        <motion.span
                            style={{
                                display: "block",
                                width: hamburgerLineWidth,
                                height: hamburgerLineThickness,
                                background: hamburgerResolvedLineColor,
                                borderRadius: 2,
                            }}
                            animate={{
                                opacity:
                                    menuOpen || (hoverHamburger && canHover)
                                        ? 0
                                        : 1,
                            }}
                            transition={
                                reducedMotion
                                    ? { duration: 0.1 }
                                    : { duration: 0.18 }
                            }
                        />
                        <motion.span
                            style={{
                                display: "block",
                                width: hamburgerLineWidth,
                                height: hamburgerLineThickness,
                                background: hamburgerResolvedLineColor,
                                borderRadius: 2,
                                transformOrigin: "center",
                            }}
                            animate={
                                reducedMotion
                                    ? {}
                                    : {
                                          y: menuOpen ? -shift : 0,
                                          rotate: menuOpen ? -45 : 0,
                                      }
                            }
                            transition={spring}
                        />
                    </motion.button>

                    {!detachPanelToBody ? (
                        <AnimatePresence>{dropdownPanel}</AnimatePresence>
                    ) : null}
                </div>
            </motion.div>

            {detachPanelToBody && typeof document !== "undefined"
                ? createPortal(
                      <AnimatePresence>{dropdownPanel}</AnimatePresence>,
                      document.body
                  )
                : null}

            <AnimatePresence>
                {showBackdrop && (
                    <motion.div
                        key="backdrop"
                        role="presentation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => closeMenu()}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: backdropColor,
                            zIndex: backdropZIndex,
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

const navBurgerDefaultProps: Partial<NavBurgerProps> = {
    linkFont: {},
    rootPosition: "relative",
    rootTop: "auto",
    rootRight: "auto",
    rootLeft: "auto",
    rootZIndex: 50,
    enableScrollReveal: false,
    scrollThresholdPx: 64,
    scrollHideOffsetPx: 100,
    menuFillEnabled: true,
    menuBackgroundColor: "rgba(43, 40, 40, 0.92)",
    menuOpacity: 1,
    menuBlurPx: 16,
    menuBorderRadius: "12px",
    menuPadding: "20px 24px",
    menuBorderColor: "rgba(233, 237, 246, 0.15)",
    menuBorderWidth: 1,
    menuZIndex: 60,
    menuOffsetTopPx: 6,
    backdropEnabled: true,
    backdropOnDesktop: false,
    backdropColor: "rgba(0,0,0,0.25)",
    backdropZIndex: 40,
    detachPanelToBody: true,
    linksAlign: "start",
    linksGap: 14,
    rollHeight: 38,
    linkTypographyMode: "framer",
    linkManualFontFamily: "",
    linkManualFontSize: 18,
    linkManualFontWeight: 500,
    linkManualFontStyle: "normal",
    linkManualLetterSpacing: "0.4em",
    linkManualLineHeight: "2.1em",
    linkManualTextTransform: "uppercase",
    linkColor: "rgb(247, 237, 216)",
    linkHoverColor: "rgb(244, 131, 117)",
    showPhone: true,
    phoneLabel: "Call us",
    phoneHref: "tel:+18778351545",
    showEmail: true,
    emailLabel: "Email us",
    emailHref: "mailto:hello@monarchcompetency.com",
    showLink1: true,
    link1Label: "Home",
    link1Url: "/",
    showLink2: true,
    link2Label: "Program",
    link2Url: "/program",
    showLink3: true,
    link3Label: "Referrals",
    link3Url: "/referrals",
    showLink4: true,
    link4Label: "Resources",
    link4Url: "/resources",
    showLink5: true,
    link5Label: "Contact",
    link5Url: "/contact",
    showLink6: false,
    link6Label: "Login",
    link6Url: "/login",
    showLink7: false,
    link7Label: "Portal",
    link7Url: "/portal",
    hamburgerLineColor: "rgb(43, 40, 40)",
    hamburgerLineThickness: 2,
    hamburgerLineWidth: 22,
    hamburgerGap: 5,
    hamburgerPadding: "4px 0",
}
NavBurger.defaultProps = navBurgerDefaultProps

addPropertyControls(NavBurger, {
    rootPosition: {
        type: ControlType.Enum,
        title: "Root Position",
        options: ["relative", "absolute", "fixed"],
        optionTitles: ["Relative", "Absolute", "Fixed"],
        defaultValue: "relative",
        displaySegmentedControl: true,
    },
    rootTop: {
        type: ControlType.String,
        title: "Root Top",
        defaultValue: "auto",
        hidden: ({ rootPosition }) => rootPosition === "relative",
    },
    rootRight: {
        type: ControlType.String,
        title: "Root Right",
        defaultValue: "auto",
        hidden: ({ rootPosition }) => rootPosition === "relative",
    },
    rootLeft: {
        type: ControlType.String,
        title: "Root Left",
        defaultValue: "auto",
        hidden: ({ rootPosition }) => rootPosition === "relative",
    },
    rootZIndex: {
        type: ControlType.Number,
        title: "Root Z-Index",
        defaultValue: 50,
        min: 0,
        max: 9999,
        step: 1,
    },

    enableScrollReveal: {
        type: ControlType.Boolean,
        title: "Scroll Reveal",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scrollThresholdPx: {
        type: ControlType.Number,
        title: "Scroll Threshold",
        defaultValue: 64,
        min: 0,
        max: 400,
        step: 4,
        unit: "px",
        hidden: ({ enableScrollReveal }) => !enableScrollReveal,
    },
    scrollHideOffsetPx: {
        type: ControlType.Number,
        title: "Hide Slide",
        defaultValue: 100,
        min: 0,
        max: 300,
        step: 4,
        unit: "px",
        hidden: ({ enableScrollReveal }) => !enableScrollReveal,
    },

    menuFillEnabled: {
        type: ControlType.Boolean,
        title: "Menu Fill",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Off: transparent panel chrome — pair with Menu blur for glass, or Fill opacity 0 to hide the box but keep links.",
    },
    menuBackgroundColor: {
        type: ControlType.Color,
        title: "Menu BG",
        defaultValue: "rgba(43, 40, 40, 0.92)",
        hidden: ({ menuFillEnabled }) => !menuFillEnabled,
    },
    menuOpacity: {
        type: ControlType.Number,
        title: "Fill opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        description:
            "Opacity of the menu background/blur layer only (not the link text). Set to 0 for invisible panel chrome.",
    },
    menuBlurPx: {
        type: ControlType.Number,
        title: "Menu Blur",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        description:
            "Backdrop blur behind the panel. Turn Menu fill off and use a frosted look; link text stays sharp.",
    },
    menuBorderRadius: {
        type: ControlType.String,
        title: "Menu Radius",
        defaultValue: "12px",
    },
    menuPadding: {
        type: ControlType.String,
        title: "Menu Padding",
        defaultValue: "20px 24px",
    },
    menuBorderColor: {
        type: ControlType.Color,
        title: "Menu Border",
        defaultValue: "rgba(233, 237, 246, 0.15)",
    },
    menuBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 1,
        unit: "px",
    },
    menuZIndex: {
        type: ControlType.Number,
        title: "Menu Z",
        defaultValue: 60,
        min: 0,
        max: 9999,
        step: 1,
    },
    menuOffsetTopPx: {
        type: ControlType.Number,
        title: "Menu Gap",
        defaultValue: 6,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },

    backdropEnabled: {
        type: ControlType.Boolean,
        title: "Backdrop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    backdropOnDesktop: {
        type: ControlType.Boolean,
        title: "Backdrop Desktop",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ backdropEnabled }) => !backdropEnabled,
    },
    backdropColor: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: "rgba(0,0,0,0.25)",
        hidden: ({ backdropEnabled }) => !backdropEnabled,
    },
    backdropZIndex: {
        type: ControlType.Number,
        title: "Backdrop Z",
        defaultValue: 40,
        min: 0,
        max: 9999,
        step: 1,
        hidden: ({ backdropEnabled }) => !backdropEnabled,
    },
    detachPanelToBody: {
        type: ControlType.Boolean,
        title: "Detach Panel",
        defaultValue: true,
        enabledTitle: "Body",
        disabledTitle: "Inline",
        description:
            "On: menu renders in document.body (not clipped by Frames). Off: absolute under icon (set Clip content off on the wrapper).",
    },

    linksAlign: {
        type: ControlType.Enum,
        title: "Links Align",
        options: ["start", "center", "end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "start",
        displaySegmentedControl: true,
    },
    linksGap: {
        type: ControlType.Number,
        title: "Links Gap",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    rollHeight: {
        type: ControlType.Number,
        title: "Roll Height",
        defaultValue: 38,
        min: 20,
        max: 56,
        step: 1,
        unit: "px",
    },
    linkTypographyMode: {
        type: ControlType.Enum,
        title: "Link Type",
        options: ["framer", "manual"],
        optionTitles: ["Framer font", "Manual"],
        defaultValue: "framer",
        displaySegmentedControl: true,
        description:
            "Framer font: use the Font control below. Manual: set family, size, weight, and casing with separate fields.",
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            letterSpacing: "0.4em",
            lineHeight: "2.1em",
        },
        hidden: ({ linkTypographyMode }) => linkTypographyMode !== "framer",
    },
    linkManualFontFamily: {
        type: ControlType.String,
        title: "Font family",
        defaultValue: "",
        placeholder: "e.g. Inter, system-ui, sans-serif",
        hidden: ({ linkTypographyMode }) => linkTypographyMode !== "manual",
    },
    linkManualFontSize: {
        type: ControlType.Number,
        title: "Font size",
        defaultValue: 18,
        min: 10,
        max: 48,
        step: 1,
        unit: "px",
        hidden: ({ linkTypographyMode }) => linkTypographyMode !== "manual",
    },
    linkManualFontWeight: {
        type: ControlType.Number,
        title: "Font weight",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 50,
        hidden: ({ linkTypographyMode }) => linkTypographyMode !== "manual",
    },
    linkManualFontStyle: {
        type: ControlType.Enum,
        title: "Font style",
        options: ["normal", "italic"],
        optionTitles: ["Normal", "Italic"],
        defaultValue: "normal",
        displaySegmentedControl: true,
        hidden: ({ linkTypographyMode }) => linkTypographyMode !== "manual",
    },
    linkManualLetterSpacing: {
        type: ControlType.String,
        title: "Letter spacing",
        defaultValue: "0.4em",
        placeholder: "e.g. 0.4em, 2px",
        hidden: ({ linkTypographyMode }) => linkTypographyMode !== "manual",
    },
    linkManualLineHeight: {
        type: ControlType.String,
        title: "Line height",
        defaultValue: "2.1em",
        placeholder: "e.g. 1.2, 2.1em",
        hidden: ({ linkTypographyMode }) => linkTypographyMode !== "manual",
    },
    linkManualTextTransform: {
        type: ControlType.Enum,
        title: "Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
        defaultValue: "uppercase",
        displaySegmentedControl: true,
        hidden: ({ linkTypographyMode }) => linkTypographyMode !== "manual",
    },
    linkColor: {
        type: ControlType.Color,
        title: "Link Color",
        defaultValue: "rgb(247, 237, 216)",
    },
    linkHoverColor: {
        type: ControlType.Color,
        title: "Link Hover",
        defaultValue: "rgb(244, 131, 117)",
    },

    showPhone: {
        type: ControlType.Boolean,
        title: "Phone Row",
        defaultValue: true,
    },
    phoneLabel: {
        type: ControlType.String,
        title: "Phone Label",
        defaultValue: "Call us",
        hidden: ({ showPhone }) => !showPhone,
    },
    phoneHref: {
        type: ControlType.String,
        title: "Phone URL",
        defaultValue: "tel:+18778351545",
        hidden: ({ showPhone }) => !showPhone,
    },
    showEmail: {
        type: ControlType.Boolean,
        title: "Email Row",
        defaultValue: true,
    },
    emailLabel: {
        type: ControlType.String,
        title: "Email Label",
        defaultValue: "Email us",
        hidden: ({ showEmail }) => !showEmail,
    },
    emailHref: {
        type: ControlType.String,
        title: "Email URL",
        defaultValue: "mailto:hello@monarchcompetency.com",
        hidden: ({ showEmail }) => !showEmail,
    },

    showLink1: { type: ControlType.Boolean, title: "Link 1", defaultValue: true },
    link1Label: {
        type: ControlType.String,
        title: "L1 Label",
        defaultValue: "Home",
        hidden: ({ showLink1 }) => !showLink1,
    },
    link1Url: {
        type: ControlType.String,
        title: "L1 URL",
        defaultValue: "/",
        hidden: ({ showLink1 }) => !showLink1,
    },
    showLink2: { type: ControlType.Boolean, title: "Link 2", defaultValue: true },
    link2Label: {
        type: ControlType.String,
        title: "L2 Label",
        defaultValue: "Program",
        hidden: ({ showLink2 }) => !showLink2,
    },
    link2Url: {
        type: ControlType.String,
        title: "L2 URL",
        defaultValue: "/program",
        hidden: ({ showLink2 }) => !showLink2,
    },
    showLink3: { type: ControlType.Boolean, title: "Link 3", defaultValue: true },
    link3Label: {
        type: ControlType.String,
        title: "L3 Label",
        defaultValue: "Referrals",
        hidden: ({ showLink3 }) => !showLink3,
    },
    link3Url: {
        type: ControlType.String,
        title: "L3 URL",
        defaultValue: "/referrals",
        hidden: ({ showLink3 }) => !showLink3,
    },
    showLink4: { type: ControlType.Boolean, title: "Link 4", defaultValue: true },
    link4Label: {
        type: ControlType.String,
        title: "L4 Label",
        defaultValue: "Resources",
        hidden: ({ showLink4 }) => !showLink4,
    },
    link4Url: {
        type: ControlType.String,
        title: "L4 URL",
        defaultValue: "/resources",
        hidden: ({ showLink4 }) => !showLink4,
    },
    showLink5: { type: ControlType.Boolean, title: "Link 5", defaultValue: true },
    link5Label: {
        type: ControlType.String,
        title: "L5 Label",
        defaultValue: "Contact",
        hidden: ({ showLink5 }) => !showLink5,
    },
    link5Url: {
        type: ControlType.String,
        title: "L5 URL",
        defaultValue: "/contact",
        hidden: ({ showLink5 }) => !showLink5,
    },
    showLink6: { type: ControlType.Boolean, title: "Link 6", defaultValue: false },
    link6Label: {
        type: ControlType.String,
        title: "L6 Label",
        defaultValue: "Login",
        hidden: ({ showLink6 }) => !showLink6,
    },
    link6Url: {
        type: ControlType.String,
        title: "L6 URL",
        defaultValue: "/login",
        hidden: ({ showLink6 }) => !showLink6,
    },
    showLink7: { type: ControlType.Boolean, title: "Link 7", defaultValue: false },
    link7Label: {
        type: ControlType.String,
        title: "L7 Label",
        defaultValue: "Portal",
        hidden: ({ showLink7 }) => !showLink7,
    },
    link7Url: {
        type: ControlType.String,
        title: "L7 URL",
        defaultValue: "/portal",
        hidden: ({ showLink7 }) => !showLink7,
    },

    hamburgerLineColor: {
        type: ControlType.Color,
        title: "Hamburger color",
        defaultValue: "rgb(43, 40, 40)",
        description: "Color of all three lines (closed and open unless you set Open color).",
    },
    hamburgerLineColorOpen: {
        type: ControlType.Color,
        title: "Hamburger (open)",
        optional: true,
        description:
            "Optional: line color when the menu is open (X). Leave empty to use Hamburger color.",
    },
    hamburgerLineThickness: {
        type: ControlType.Number,
        title: "Line Thick",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
        unit: "px",
    },
    hamburgerLineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 22,
        min: 14,
        max: 40,
        step: 1,
        unit: "px",
    },
    hamburgerGap: {
        type: ControlType.Number,
        title: "Line Gap",
        defaultValue: 5,
        min: 2,
        max: 12,
        step: 1,
        unit: "px",
    },
    hamburgerPadding: {
        type: ControlType.String,
        title: "Burger Pad",
        defaultValue: "4px 0",
    },
})
