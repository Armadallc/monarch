// Instructions: Create an interactive component called “Scroll Steps Cards” with support for at least 5 cards, with vertical/horizontal scroll modes, pin/capture behavior in horizontal, smooth active card scale/opacity transitions, responsive layout, editable card data controls, typography/visual/animation controls, reduced-motion support, and accessibility.

import * as React from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import {
    motion,
    useInView,
    useMotionValue,
    useReducedMotion,
    useScroll,
    useTransform,
    type MotionValue,
    type Transition,
} from "framer-motion"

type ScrollMode = "horizontal" | "vertical"
type TransitionType = "spring" | "easeOut"

type CardImage = { src: string; srcSet?: string; alt?: string }

type CardData = {
    stepNumber: string
    stepName: string
    stepDescription: string
    image: CardImage
    showLink: boolean
    linkLabel: string
    linkUrl: string
}

type FontLike = {
    fontSize?: string | number
    lineHeight?: string | number
    letterSpacing?: string | number
    textAlign?: any
    fontFamily?: string
    fontWeight?: any
    fontStyle?: any
    fontVariant?: any
}

type Props = {
    cards: CardData[]

    scrollMode: ScrollMode
    sectionPin: boolean
    releaseOnLastCard: boolean
    snapToCard: boolean

    cardBackgroundColor: string
    cardOpacity: number
    cornerRadius: string
    backgroundBlur: number
    cardPadding: string
    cardGap: number

    stepNumberFont: FontLike
    stepNameFont: FontLike
    stepDescriptionFont: FontLike
    fontColor: string

    scaleMin: number
    scaleMax: number
    transitionType: TransitionType
    stiffness: number
    damping: number
    mass: number
    fadeStrength: number

    style?: React.CSSProperties
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function smoothstep(edge0: number, edge1: number, x: number) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
}

function useElementSize<T extends HTMLElement>() {
    const ref = React.useRef<T | null>(null)
    const [size, setSize] = React.useState({ width: 0, height: 0 })

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const el = ref.current
        if (!el) return

        const ro = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const cr = entry.contentRect
            React.startTransition(() => setSize({ width: cr.width, height: cr.height }))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    return { ref, size }
}

function buildTransition(
    transitionType: TransitionType,
    prefersReducedMotion: boolean,
    stiffness: number,
    damping: number,
    mass: number
): Transition {
    if (prefersReducedMotion) return { type: "tween", duration: 0.25, ease: "easeOut" }
    if (transitionType === "spring") return { type: "spring", stiffness, damping, mass }
    return { type: "tween", duration: 0.45, ease: "easeOut" }
}

function getAxisProps(scrollMode: ScrollMode) {
    const isHorizontal = scrollMode === "horizontal"
    return { isHorizontal }
}

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollStepsCards(props: Props) {
    const {
        cards: rawCards = [],
        scrollMode = "horizontal",
        sectionPin = true,
        releaseOnLastCard = true,
        snapToCard = false,

        cardBackgroundColor = "#FFFFFF",
        cardOpacity = 0.92,
        cornerRadius = "24px",
        backgroundBlur = 10,
        cardPadding = "28px",
        cardGap = 20,

        stepNumberFont,
        stepNameFont,
        stepDescriptionFont,
        fontColor = "#000000",

        scaleMin = 0.94,
        scaleMax = 1,
        transitionType = "spring",
        stiffness = 240,
        damping = 28,
        mass = 0.9,
        fadeStrength = 0.18,

        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const cards: CardData[] = React.useMemo(() => {
        const fallback: CardData[] = [
            {
                stepNumber: "01",
                stepName: "Discover",
                stepDescription: "Understand goals, constraints, and what success looks like.",
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Step 1",
                },
                showLink: true,
                linkLabel: "Learn more",
                linkUrl: "https://example.com",
            },
            {
                stepNumber: "02",
                stepName: "Plan",
                stepDescription: "Create a clear plan and prioritize what matters most.",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Step 2",
                },
                showLink: false,
                linkLabel: "Learn more",
                linkUrl: "https://example.com",
            },
            {
                stepNumber: "03",
                stepName: "Design",
                stepDescription: "Iterate on layout, content, and visual system with feedback loops.",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Step 3",
                },
                showLink: true,
                linkLabel: "See examples",
                linkUrl: "https://example.com",
            },
            {
                stepNumber: "04",
                stepName: "Build",
                stepDescription: "Implement components, interactions, and polish the experience.",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Step 4",
                },
                showLink: false,
                linkLabel: "Learn more",
                linkUrl: "https://example.com",
            },
            {
                stepNumber: "05",
                stepName: "Launch",
                stepDescription: "Ship with confidence and measure impact over time.",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Step 5",
                },
                showLink: true,
                linkLabel: "Get started",
                linkUrl: "https://example.com",
            },
        ]

        const cleaned = (rawCards?.length ? rawCards : fallback).map((c, i) => ({
            stepNumber: c?.stepNumber ?? String(i + 1).padStart(2, "0"),
            stepName: c?.stepName ?? `Step ${i + 1}`,
            stepDescription: c?.stepDescription ?? "",
            image: c?.image ?? {
                src: fallback[i % fallback.length].image.src,
                alt: `Step ${i + 1}`,
            },
            showLink: Boolean(c?.showLink),
            linkLabel: c?.linkLabel ?? "Learn more",
            linkUrl: c?.linkUrl ?? "https://example.com",
        }))

        return cleaned.length >= 1 ? cleaned : fallback
    }, [rawCards])

    const count = cards.length
    const steps = Math.max(1, count - 1)
    const { isHorizontal } = getAxisProps(scrollMode)

    const outerRef = React.useRef<HTMLDivElement | null>(null)

    const { scrollYProgress } = useScroll({
        target: outerRef,
        offset: ["start start", "end end"],
    })

    const inViewRef = React.useRef<HTMLDivElement | null>(null)
    const isInView = useInView(inViewRef, { margin: "-10% 0px -10% 0px", amount: 0.15 })

    const { ref: viewportRef, size: viewportSize } = useElementSize<HTMLDivElement>()
    /** Motion value so rail translation updates when width is measured (plain state in useTransform is often stale). */
    const viewportWidthMv = useMotionValue(0)
    React.useLayoutEffect(() => {
        viewportWidthMv.set(viewportSize.width)
    }, [viewportSize.width, viewportWidthMv])

    const isNarrow = viewportSize.width > 0 ? viewportSize.width < 700 : false

    const progressSteps: MotionValue<number> = useTransform(scrollYProgress, (p) => clamp(p, 0, 1) * steps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const transition = React.useMemo(
        () => buildTransition(transitionType, Boolean(reducedMotion), stiffness, damping, mass),
        [transitionType, reducedMotion, stiffness, damping, mass]
    )

    // Horizontal translate for the rail (depends on live width + scroll progress)
    const railX: MotionValue<number> = useTransform(
        [progressSteps, viewportWidthMv],
        ([v, w]) => (isHorizontal ? -(Number(v) || 0) * (Number(w) || 0) : 0)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Optional snapping to nearest card (horizontal or vertical) when scrolling stops while section is active.
    const snapTimerRef = React.useRef<number | null>(null)
    const lastScrollYRef = React.useRef<number>(0)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        if (reducedMotion) return
        if (!snapToCard) return
        if (!isInView) return

        const handleScroll = () => {
            if (!outerRef.current) return
            if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current)

            snapTimerRef.current = window.setTimeout(() => {
                const outer = outerRef.current
                if (!outer) return
                const rect = outer.getBoundingClientRect()
                const topInDoc = window.scrollY + rect.top
                const scrollLen = Math.max(1, rect.height - window.innerHeight)

                const y = window.scrollY
                const rel = clamp((y - topInDoc) / scrollLen, 0, 1)
                const v = rel * steps
                const nearest = Math.round(v)
                const targetRel = nearest / steps
                const targetY = topInDoc + targetRel * scrollLen

                if (Math.abs(targetY - window.scrollY) < 2) return
                // Avoid fighting user momentum / very rapid scroll.
                const dy = Math.abs(window.scrollY - lastScrollYRef.current)
                lastScrollYRef.current = window.scrollY
                if (dy > 120) return

                window.scrollTo({ top: targetY, behavior: "smooth" })
            }, 120)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", handleScroll as any)
            if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current)
        }
    }, [isStatic, reducedMotion, snapToCard, isInView, steps])

    const pinned = isHorizontal ? sectionPin : false

    const sectionHeight = React.useMemo(() => {
        // Make the section "long" so scrolling progresses through cards while the viewport stays on the component.
        // Height = N * 100vh yields scroll length (N-1)*vh which maps cleanly across (N-1) steps.
        return `calc(${count} * 100vh)`
    }, [count])

    const rootStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...style,
            position: "relative",
            width: "100%",
            height: "100%",
        }),
        [style]
    )

    const cardSurfaceStyle: React.CSSProperties = React.useMemo(
        () => ({
            background: cardBackgroundColor,
            opacity: clamp(cardOpacity, 0, 1),
            borderRadius: cornerRadius,
            backdropFilter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
            WebkitBackdropFilter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
        }),
        [cardBackgroundColor, cardOpacity, cornerRadius, backgroundBlur]
    )

    const viewportWrapStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: pinned ? "sticky" : "relative",
            top: pinned ? 0 : undefined,
            height: pinned ? "100vh" : "100%",
            width: "100%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
        }),
        [pinned]
    )

    const outerStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: isHorizontal ? sectionHeight : sectionHeight,
            // Helps avoid accidental rubber-banding / chaining inside some layouts.
            overscrollBehavior: "contain",
        }),
        [isHorizontal, sectionHeight]
    )

    const hintAria = React.useMemo(() => {
        if (isHorizontal) return "Scroll to advance steps horizontally."
        return "Scroll to advance steps vertically."
    }, [isHorizontal])

    // Release behavior: with sticky + tall container this naturally releases after last card state.
    // Ensure last card is "fully reached" at end progress; we already map end->last.
    const shouldRun = !isStatic && isInView
    /** Do not gate horizontal rail on isInView — IO can flicker during sticky scroll and freeze x at 0 while progress advances. */
    const horizontalScrollActive = !isStatic

    // Static/Canvas: show first card only, no motion.
    if (isStatic) {
        const c0 = cards[0]
        return (
            <section style={rootStyle} aria-label="Scroll Steps Cards">
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                        }}
                    >
                        <div
                            style={{
                                width: "min(1100px, 100%)",
                                height: "min(640px, 100%)",
                                padding: cardPadding,
                                boxSizing: "border-box",
                                display: "flex",
                                gap: cardGap,
                                flexDirection: isNarrow ? "column" : "row",
                                alignItems: "stretch",
                                justifyContent: "space-between",
                                ...cardSurfaceStyle,
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 14,
                                    color: fontColor,
                                }}
                            >
                                <div
                                    style={{
                                        ...stepNumberFont,
                                        color: fontColor,
                                        opacity: 0.85,
                                        width: "max-content",
                                    }}
                                >
                                    {c0.stepNumber}
                                </div>
                                <div style={{ ...stepNameFont, color: fontColor }}>{c0.stepName}</div>
                                <div style={{ ...stepDescriptionFont, color: fontColor, opacity: 0.9 }}>
                                    {c0.stepDescription}
                                </div>
                                {c0.showLink && c0.linkUrl ? (
                                    <a
                                        href={c0.linkUrl}
                                        style={{
                                            display: "inline-flex",
                                            width: "max-content",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 8,
                                            padding: "10px 14px",
                                            borderRadius: 999,
                                            border: `1px solid rgba(0,0,0,0.12)`,
                                            color: fontColor,
                                            textDecoration: "none",
                                            marginTop: 6,
                                        }}
                                        aria-label={c0.linkLabel || "Learn more"}
                                    >
                                        <span style={{ width: "max-content", ...stepDescriptionFont }}>
                                            {c0.linkLabel || "Learn more"}
                                        </span>
                                    </a>
                                ) : null}
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                    background: "rgba(0,0,0,0.04)",
                                    position: "relative",
                                }}
                                role="img"
                                aria-label={c0.image?.alt || ""}
                            >
                                {c0.image?.src ? (
                                    <img
                                        src={c0.image.src}
                                        srcSet={c0.image.srcSet}
                                        alt={c0.image?.alt || ""}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section style={rootStyle} aria-label="Scroll Steps Cards">
            <div ref={outerRef} style={outerStyle}>
                <div ref={inViewRef} style={viewportWrapStyle} aria-label={hintAria}>
                    <div
                        ref={viewportRef as any}
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            // Horizontal: rail is wider than viewport; centering it shifts the window to middle cards.
                            justifyContent: isHorizontal ? "flex-start" : "center",
                        }}
                    >
                        {isHorizontal ? (
                            <motion.div
                                style={{
                                    position: "relative",
                                    width: viewportSize.width ? viewportSize.width * count : "100%",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    x: horizontalScrollActive ? railX : 0,
                                    willChange: "transform",
                                }}
                                aria-roledescription="carousel"
                                aria-label="Scroll steps"
                            >
                                {cards.map((card, i) => (
                                    <StepCard
                                        key={`${card.stepNumber}-${i}`}
                                        card={card}
                                        index={i}
                                        count={count}
                                        mode={scrollMode}
                                        progressSteps={progressSteps}
                                        transition={transition}
                                        scaleMin={reducedMotion ? 0.98 : scaleMin}
                                        scaleMax={scaleMax}
                                        fadeStrength={reducedMotion ? 0.08 : fadeStrength}
                                        fontColor={fontColor}
                                        stepNumberFont={stepNumberFont}
                                        stepNameFont={stepNameFont}
                                        stepDescriptionFont={stepDescriptionFont}
                                        surfaceStyle={cardSurfaceStyle}
                                        cardPadding={cardPadding}
                                        cardGap={cardGap}
                                        isNarrow={isNarrow}
                                        viewportWidth={viewportSize.width || 0}
                                        viewportHeight={viewportSize.height || 0}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    overflow: "hidden",
                                }}
                                aria-label="Scroll steps"
                            >
                                {cards.map((card, i) => (
                                    <VerticalLayeredCard
                                        key={`${card.stepNumber}-${i}`}
                                        card={card}
                                        index={i}
                                        count={count}
                                        progressSteps={progressSteps}
                                        transition={transition}
                                        scaleMin={reducedMotion ? 0.985 : scaleMin}
                                        scaleMax={scaleMax}
                                        fadeStrength={reducedMotion ? 0.08 : fadeStrength}
                                        fontColor={fontColor}
                                        stepNumberFont={stepNumberFont}
                                        stepNameFont={stepNameFont}
                                        stepDescriptionFont={stepDescriptionFont}
                                        surfaceStyle={cardSurfaceStyle}
                                        cardPadding={cardPadding}
                                        cardGap={cardGap}
                                        isNarrow={isNarrow}
                                        shouldRun={shouldRun}
                                    />
                                ))}
                                {/* Natural release after last card; no extra logic required for sticky method. */}
                                {!releaseOnLastCard ? null : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

function useCardEmphasis(
    progressSteps: MotionValue<number>,
    index: number,
    scaleMin: number,
    scaleMax: number,
    fadeStrength: number
) {
    const scale = useTransform(progressSteps, (v) => {
        const d = Math.abs(v - index)
        const t = 1 - smoothstep(0, 1, d)
        return lerp(scaleMin, scaleMax, t)
    })

    const opacity = useTransform(progressSteps, (v) => {
        const d = Math.abs(v - index)
        const t = 1 - smoothstep(0, 1.25, d)
        const minO = clamp(1 - fadeStrength, 0.15, 1)
        return lerp(minO, 1, t)
    })

    const lift = useTransform(progressSteps, (v) => {
        const d = Math.abs(v - index)
        const t = 1 - smoothstep(0, 1, d)
        return lerp(16, 0, t)
    })

    return { scale, opacity, lift }
}

function StepCard(props: {
    card: CardData
    index: number
    count: number
    mode: ScrollMode
    progressSteps: MotionValue<number>
    transition: Transition
    scaleMin: number
    scaleMax: number
    fadeStrength: number
    fontColor: string
    stepNumberFont: FontLike
    stepNameFont: FontLike
    stepDescriptionFont: FontLike
    surfaceStyle: React.CSSProperties
    cardPadding: string
    cardGap: number
    isNarrow: boolean
    viewportWidth: number
    viewportHeight: number
}) {
    const {
        card,
        index,
        progressSteps,
        transition,
        scaleMin,
        scaleMax,
        fadeStrength,
        fontColor,
        stepNumberFont,
        stepNameFont,
        stepDescriptionFont,
        surfaceStyle,
        cardPadding,
        cardGap,
        isNarrow,
        viewportWidth,
        viewportHeight,
    } = props

    const { scale, opacity, lift } = useCardEmphasis(progressSteps, index, scaleMin, scaleMax, fadeStrength)

    const cardWidth = viewportWidth || 0

    return (
        <div
            style={{
                position: "relative",
                width: cardWidth ? `${cardWidth}px` : "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                boxSizing: "border-box",
                flex: "0 0 auto",
            }}
            aria-label={`Step ${card.stepNumber}: ${card.stepName}`}
        >
            <motion.article
                style={{
                    width: "min(1100px, calc(100% - 48px))",
                    height: viewportHeight ? "min(640px, calc(100% - 48px))" : "min(640px, 100%)",
                    boxSizing: "border-box",
                    padding: cardPadding,
                    display: "flex",
                    flexDirection: isNarrow ? "column" : "row",
                    alignItems: "stretch",
                    justifyContent: "space-between",
                    gap: cardGap,
                    scale,
                    opacity,
                    y: lift,
                    willChange: "transform, opacity",
                    ...surfaceStyle,
                }}
                transition={transition}
            >
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        color: fontColor,
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            ...stepNumberFont,
                            color: fontColor,
                            opacity: 0.82,
                            width: "max-content",
                        }}
                    >
                        {card.stepNumber}
                    </div>
                    <div style={{ ...stepNameFont, color: fontColor }}>{card.stepName}</div>
                    <div style={{ ...stepDescriptionFont, color: fontColor, opacity: 0.9 }}>
                        {card.stepDescription}
                    </div>
                    {card.showLink && card.linkUrl ? (
                        <a
                            href={card.linkUrl}
                            style={{
                                display: "inline-flex",
                                width: "max-content",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                padding: "10px 14px",
                                borderRadius: 999,
                                border: `1px solid rgba(0,0,0,0.12)`,
                                color: fontColor,
                                textDecoration: "none",
                                marginTop: 6,
                                outlineOffset: 3,
                            }}
                            aria-label={card.linkLabel || "Learn more"}
                        >
                            <span style={{ width: "max-content", ...stepDescriptionFont }}>
                                {card.linkLabel || "Learn more"}
                            </span>
                        </a>
                    ) : null}
                </div>

                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        borderRadius: "16px",
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.04)",
                        position: "relative",
                    }}
                    role="img"
                    aria-label={card.image?.alt || ""}
                >
                    {card.image?.src ? (
                        <img
                            src={card.image.src}
                            srcSet={card.image.srcSet}
                            alt={card.image?.alt || ""}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : null}
                </div>
            </motion.article>
        </div>
    )
}

function VerticalLayeredCard(props: {
    card: CardData
    index: number
    count: number
    progressSteps: MotionValue<number>
    transition: Transition
    scaleMin: number
    scaleMax: number
    fadeStrength: number
    fontColor: string
    stepNumberFont: FontLike
    stepNameFont: FontLike
    stepDescriptionFont: FontLike
    surfaceStyle: React.CSSProperties
    cardPadding: string
    cardGap: number
    isNarrow: boolean
    shouldRun: boolean
}) {
    const {
        card,
        index,
        progressSteps,
        transition,
        scaleMin,
        scaleMax,
        fadeStrength,
        fontColor,
        stepNumberFont,
        stepNameFont,
        stepDescriptionFont,
        surfaceStyle,
        cardPadding,
        cardGap,
        isNarrow,
        shouldRun,
    } = props

    const { scale, opacity, lift } = useCardEmphasis(progressSteps, index, scaleMin, scaleMax, fadeStrength)

    // In vertical mode, keep cards stacked (no layout jump) and bring the active card forward.
    const zIndex = useTransform(progressSteps, (v) => {
        const d = Math.abs(v - index)
        return 1000 - Math.round(d * 10)
    })

    return (
        <motion.article
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                boxSizing: "border-box",
                zIndex: shouldRun ? (zIndex as any) : 1,
                pointerEvents: "none",
            }}
            aria-label={`Step ${card.stepNumber}: ${card.stepName}`}
        >
            <motion.div
                style={{
                    width: "min(1100px, calc(100% - 48px))",
                    height: "min(640px, calc(100% - 48px))",
                    boxSizing: "border-box",
                    padding: cardPadding,
                    display: "flex",
                    flexDirection: isNarrow ? "column" : "row",
                    alignItems: "stretch",
                    justifyContent: "space-between",
                    gap: cardGap,
                    scale: shouldRun ? scale : 1,
                    opacity: shouldRun ? opacity : 1,
                    y: shouldRun ? lift : 0,
                    willChange: "transform, opacity",
                    pointerEvents: "auto",
                    ...surfaceStyle,
                }}
                transition={transition}
            >
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        color: fontColor,
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            ...stepNumberFont,
                            color: fontColor,
                            opacity: 0.82,
                            width: "max-content",
                        }}
                    >
                        {card.stepNumber}
                    </div>
                    <div style={{ ...stepNameFont, color: fontColor }}>{card.stepName}</div>
                    <div style={{ ...stepDescriptionFont, color: fontColor, opacity: 0.9 }}>
                        {card.stepDescription}
                    </div>
                    {card.showLink && card.linkUrl ? (
                        <a
                            href={card.linkUrl}
                            style={{
                                display: "inline-flex",
                                width: "max-content",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                padding: "10px 14px",
                                borderRadius: 999,
                                border: `1px solid rgba(0,0,0,0.12)`,
                                color: fontColor,
                                textDecoration: "none",
                                marginTop: 6,
                                outlineOffset: 3,
                                pointerEvents: "auto",
                            }}
                            aria-label={card.linkLabel || "Learn more"}
                        >
                            <span style={{ width: "max-content", ...stepDescriptionFont }}>
                                {card.linkLabel || "Learn more"}
                            </span>
                        </a>
                    ) : null}
                </div>

                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        borderRadius: "16px",
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.04)",
                        position: "relative",
                    }}
                    role="img"
                    aria-label={card.image?.alt || ""}
                >
                    {card.image?.src ? (
                        <img
                            src={card.image.src}
                            srcSet={card.image.srcSet}
                            alt={card.image?.alt || ""}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : null}
                </div>
            </motion.div>
        </motion.article>
    )
}

addPropertyControls(ScrollStepsCards, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 24,
        defaultValue: [
            {
                stepNumber: "01",
                stepName: "Discover",
                stepDescription: "Understand goals, constraints, and what success looks like.",
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                showLink: true,
                linkLabel: "Learn more",
                linkUrl: "https://example.com",
            },
            {
                stepNumber: "02",
                stepName: "Plan",
                stepDescription: "Create a clear plan and prioritize what matters most.",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4 - Yellow",
                },
                showLink: false,
                linkLabel: "Learn more",
                linkUrl: "https://example.com",
            },
            {
                stepNumber: "03",
                stepName: "Design",
                stepDescription: "Iterate on layout, content, and visual system with feedback loops.",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                showLink: true,
                linkLabel: "See examples",
                linkUrl: "https://example.com",
            },
            {
                stepNumber: "04",
                stepName: "Build",
                stepDescription: "Implement components, interactions, and polish the experience.",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
                showLink: false,
                linkLabel: "Learn more",
                linkUrl: "https://example.com",
            },
            {
                stepNumber: "05",
                stepName: "Launch",
                stepDescription: "Ship with confidence and measure impact over time.",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
                showLink: true,
                linkLabel: "Get started",
                linkUrl: "https://example.com",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                stepNumber: { type: ControlType.String, title: "Step #", defaultValue: "01" },
                stepName: { type: ControlType.String, title: "Name", defaultValue: "Step name" },
                stepDescription: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Describe the step.",
                    displayTextArea: true,
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                showLink: { type: ControlType.Boolean, title: "Show Link", defaultValue: false },
                linkLabel: {
                    type: ControlType.String,
                    title: "Link Label",
                    defaultValue: "Learn more",
                },
                linkUrl: { type: ControlType.Link, title: "Link URL", defaultValue: "https://example.com" },
            },
        },
    },

    scrollMode: {
        type: ControlType.Enum,
        title: "Scroll Mode",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    sectionPin: {
        type: ControlType.Boolean,
        title: "Section Pin",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => p.scrollMode !== "horizontal",
    },
    releaseOnLastCard: {
        type: ControlType.Boolean,
        title: "Release End",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    snapToCard: {
        type: ControlType.Boolean,
        title: "Snap",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    cardBackgroundColor: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#FFFFFF",
    },
    cardOpacity: {
        type: ControlType.Number,
        title: "Card Opacity",
        defaultValue: 0.92,
        min: 0,
        max: 1,
        step: 0.01,
    },
    cornerRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "24px",
    },
    backgroundBlur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cardPadding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "28px",
    },
    cardGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },

    stepNumberFont: {
        type: ControlType.Font,
        title: "Step # Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.1em",
        },
    },
    stepNameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    stepDescriptionFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
    },
    fontColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },

    scaleMin: {
        type: ControlType.Number,
        title: "Scale Min",
        defaultValue: 0.94,
        min: 0.7,
        max: 1,
        step: 0.01,
    },
    scaleMax: {
        type: ControlType.Number,
        title: "Scale Max",
        defaultValue: 1,
        min: 0.9,
        max: 1.08,
        step: 0.01,
    },
    transitionType: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["spring", "easeOut"],
        optionTitles: ["Spring", "Ease-out"],
        defaultValue: "spring",
        displaySegmentedControl: true,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 240,
        min: 50,
        max: 600,
        step: 1,
        hidden: (p) => p.transitionType !== "spring",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 28,
        min: 5,
        max: 80,
        step: 1,
        hidden: (p) => p.transitionType !== "spring",
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: 0.9,
        min: 0.2,
        max: 3,
        step: 0.05,
        hidden: (p) => p.transitionType !== "spring",
    },
    fadeStrength: {
        type: ControlType.Number,
        title: "Fade",
        defaultValue: 0.18,
        min: 0,
        max: 0.75,
        step: 0.01,
    },
})