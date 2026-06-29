// Team Reveal Grid — Row-driven team grid. Each row carries its own member
// array (1–3 cards per row). Card width and height are universal across the
// whole component (set once, apply to every card) and DO NOT auto-resize
// when a row has fewer than 3 cards.
//
// Visual language mirrors ProductCard: full-bleed photo background, padded
// content, configurable image and text positions, large border-radius. The
// click-to-open modal inherits the same overlay style at modal proportions.
//
// Made for Monarch · V1.0

import { motion, AnimatePresence, useInView } from "framer-motion"
import {
    useRef,
    useState,
    useEffect,
    startTransition,
    type CSSProperties,
} from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { X } from "lucide-react"

type Position =
    | "top-left"
    | "top-center"
    | "top-right"
    | "center-left"
    | "center"
    | "center-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"

type ImageFocus = "top" | "center" | "bottom" | "left" | "right"

interface TeamMember {
    photo: { src: string; alt: string }
    name: string
    position: string
    nameColor: string
    positionColor: string
    modalHeading: string
    modalDescription: string
}

interface TeamRow {
    members: TeamMember[]
}

interface TeamRevealGridProps {
    rows: TeamRow[]

    cardWidth: number
    cardHeight: number
    cardGap: number
    rowGap: number
    rowAlignment: "left" | "center" | "right"

    cardBorderRadius: number
    cardPadding: number
    cardImagePosition: ImageFocus
    cardTextPosition: Position
    cardTextColor: string
    cardOverlayGradient: boolean
    cardOverlayStrength: number

    nameFont: CSSProperties
    positionFont: CSSProperties

    dimOpacity: number
    blurStrength: number
    hoverScale: number
    enableAppearAnimation: boolean
    animationDuration: number
    staggerDelay: number
    hoverAnimationDuration: number

    sectionPadding: number
    sectionRadius: number
    backgroundColor: string

    modalWidth: number
    modalHeight: number
    modalBorderRadius: number
    modalPadding: number
    modalBackgroundColor: string
    modalImagePosition: ImageFocus
    modalImageStartOpacity: number
    modalImageFadePoint: number
    modalImageDesaturate: boolean
    modalTextPosition: Position
    modalTextColor: string

    modalHeadingFont: CSSProperties
    modalBodyFont: CSSProperties

    modalBackdropColor: string
    modalBackdropBlur: number
    modalCloseColor: string
    modalCloseBackground: string

    style?: CSSProperties
}

const FALLBACK_PHOTO = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Team member",
}

function positionToFlexAlign(
    pos: Position
): { justifyContent: string; alignItems: string; textAlign: "left" | "center" | "right" } {
    const [vert, horiz] = pos.split("-") as [
        "top" | "center" | "bottom",
        "left" | "center" | "right",
    ]
    const justifyContent =
        vert === "top" ? "flex-start" : vert === "center" ? "center" : "flex-end"
    const alignItems =
        horiz === "left"
            ? "flex-start"
            : horiz === "center"
              ? "center"
              : "flex-end"
    const textAlign: "left" | "center" | "right" =
        horiz === "center" ? "center" : horiz
    return { justifyContent, alignItems, textAlign }
}

function imageFocusToObjectPosition(focus: ImageFocus): string {
    switch (focus) {
        case "top":
            return "center top"
        case "bottom":
            return "center bottom"
        case "left":
            return "left center"
        case "right":
            return "right center"
        case "center":
        default:
            return "center center"
    }
}

function rowAlignToFlex(align: "left" | "center" | "right"): string {
    return align === "left"
        ? "flex-start"
        : align === "right"
          ? "flex-end"
          : "center"
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function TeamRevealGrid(props: TeamRevealGridProps) {
    const {
        rows,
        cardWidth,
        cardHeight,
        cardGap,
        rowGap,
        rowAlignment,
        cardBorderRadius,
        cardPadding,
        cardImagePosition,
        cardTextPosition,
        cardTextColor,
        cardOverlayGradient,
        cardOverlayStrength,
        nameFont,
        positionFont,
        dimOpacity,
        blurStrength,
        hoverScale,
        enableAppearAnimation,
        animationDuration,
        staggerDelay,
        hoverAnimationDuration,
        sectionPadding,
        sectionRadius,
        backgroundColor,
        modalWidth,
        modalHeight,
        modalBorderRadius,
        modalPadding,
        modalBackgroundColor,
        modalImagePosition,
        modalImageStartOpacity,
        modalImageFadePoint,
        modalImageDesaturate,
        modalTextPosition,
        modalTextColor,
        modalHeadingFont,
        modalBodyFont,
        modalBackdropColor,
        modalBackdropBlur,
        modalCloseColor,
        modalCloseBackground,
    } = props

    const [hoveredKey, setHoveredKey] = useState<string | null>(null)
    const [activeKey, setActiveKey] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.15 })
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (typeof window === "undefined") return
        const checkMobile = () => {
            startTransition(() => setIsMobile(window.innerWidth < 768))
        }
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setActiveKey(null)
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    useEffect(() => {
        if (typeof document === "undefined") return
        if (activeKey === null) return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = prev
        }
    }, [activeKey])

    const clampedDim = Math.max(0, Math.min(1, dimOpacity ?? 0.6))
    const clampedBlur = Math.max(0, blurStrength ?? 5)
    const clampedOverlay = Math.max(0, Math.min(1, cardOverlayStrength ?? 0.35))
    const startOpacity = Math.max(
        0,
        Math.min(1, modalImageStartOpacity ?? 0.5)
    )
    const fadePoint = Math.max(0.2, Math.min(1, modalImageFadePoint ?? 1))
    const modalImageMask = `linear-gradient(180deg, rgba(0,0,0,${startOpacity}) 0%, rgba(0,0,0,0) ${(fadePoint * 100).toFixed(1)}%)`

    const isFixedHeight = props?.style?.height === "100%"

    let activeMember: TeamMember | null = null
    if (activeKey) {
        const [rIdxStr, mIdxStr] = activeKey.split(":")
        const rIdx = Number(rIdxStr)
        const mIdx = Number(mIdxStr)
        if (
            !Number.isNaN(rIdx) &&
            !Number.isNaN(mIdx) &&
            rows[rIdx] &&
            rows[rIdx].members[mIdx]
        ) {
            activeMember = rows[rIdx].members[mIdx]
        }
    }

    const cardTextLayout = positionToFlexAlign(cardTextPosition)
    const modalTextLayout = positionToFlexAlign(modalTextPosition)

    let globalIndex = 0

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                minHeight: isFixedHeight ? "100%" : "auto",
                backgroundColor,
                padding: `${sectionPadding}px`,
                borderRadius: sectionRadius,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${rowGap}px`,
                    alignItems: "stretch",
                }}
            >
                {rows.map((row, rIdx) => {
                    const members = row.members || []
                    return (
                        <div
                            key={`row-${rIdx}`}
                            style={{
                                display: "flex",
                                flexDirection: isMobile ? "column" : "row",
                                gap: `${cardGap}px`,
                                justifyContent: isMobile
                                    ? "stretch"
                                    : rowAlignToFlex(rowAlignment),
                                alignItems: isMobile ? "stretch" : "flex-start",
                                width: "100%",
                                flexWrap: isMobile ? "nowrap" : "wrap",
                            }}
                        >
                            {members.map((member, mIdx) => {
                                const photo = member.photo || FALLBACK_PHOTO
                                const cardKey = `${rIdx}:${mIdx}`
                                const focusedThisCard = isStatic
                                    ? true
                                    : hoveredKey === null ||
                                      hoveredKey === cardKey
                                const indexForStagger = globalIndex
                                globalIndex += 1

                                return (
                                    <motion.button
                                        key={cardKey}
                                        type="button"
                                        initial={
                                            isStatic || !enableAppearAnimation
                                                ? {
                                                      opacity: 1,
                                                      filter: "blur(0px)",
                                                      scale: 1,
                                                  }
                                                : {
                                                      opacity: 0,
                                                      filter: "blur(8px)",
                                                      scale: 0.95,
                                                  }
                                        }
                                        animate={
                                            isStatic || !enableAppearAnimation
                                                ? {
                                                      opacity: 1,
                                                      filter: "blur(0px)",
                                                      scale: 1,
                                                  }
                                                : isInView
                                                  ? {
                                                        opacity: 1,
                                                        filter: "blur(0px)",
                                                        scale: 1,
                                                    }
                                                  : {
                                                        opacity: 0,
                                                        filter: "blur(8px)",
                                                        scale: 0.95,
                                                    }
                                        }
                                        transition={{
                                            duration: animationDuration,
                                            delay: enableAppearAnimation
                                                ? indexForStagger * staggerDelay
                                                : 0,
                                            ease: [0.25, 0.1, 0.25, 1],
                                        }}
                                        onMouseEnter={() =>
                                            !isMobile &&
                                            startTransition(() =>
                                                setHoveredKey(cardKey)
                                            )
                                        }
                                        onMouseLeave={() =>
                                            !isMobile &&
                                            startTransition(() =>
                                                setHoveredKey(null)
                                            )
                                        }
                                        onClick={() => setActiveKey(cardKey)}
                                        whileHover={
                                            isStatic || isMobile
                                                ? {}
                                                : {
                                                      scale: hoverScale,
                                                      transition: {
                                                          duration:
                                                              hoverAnimationDuration,
                                                          ease: [
                                                              0.25, 0.1, 0.25,
                                                              1,
                                                          ],
                                                      },
                                                  }
                                        }
                                        whileTap={
                                            isStatic || isMobile
                                                ? {}
                                                : {
                                                      scale: 0.98,
                                                      transition: {
                                                          duration: 0.15,
                                                      },
                                                  }
                                        }
                                        style={{
                                            position: "relative",
                                            width: isMobile
                                                ? "100%"
                                                : `${cardWidth}px`,
                                            height: isMobile
                                                ? `${Math.round(
                                                      (cardHeight / cardWidth) *
                                                          Math.min(
                                                              cardWidth,
                                                              360
                                                          )
                                                  )}px`
                                                : `${cardHeight}px`,
                                            flex: "0 0 auto",
                                            cursor: "pointer",
                                            borderRadius: cardBorderRadius,
                                            overflow: "hidden",
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            display: "block",
                                            textAlign: "inherit",
                                            font: "inherit",
                                            color: "inherit",
                                        }}
                                        aria-label={`Open bio for ${member.name || "team member"}`}
                                    >
                                        <motion.div
                                            animate={
                                                isStatic
                                                    ? {
                                                          opacity: 1,
                                                          filter: "blur(0px) saturate(100%)",
                                                      }
                                                    : {
                                                          opacity:
                                                              focusedThisCard
                                                                  ? 1
                                                                  : clampedDim,
                                                          filter: focusedThisCard
                                                              ? "blur(0px) saturate(100%)"
                                                              : `blur(${clampedBlur}px) saturate(90%)`,
                                                      }
                                            }
                                            transition={{
                                                type: "spring",
                                                stiffness: 80,
                                                damping: 25,
                                                mass: 1.2,
                                            }}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                position: "relative",
                                            }}
                                        >
                                            <img
                                                src={photo.src}
                                                alt={
                                                    photo.alt ||
                                                    member.name ||
                                                    ""
                                                }
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    objectPosition:
                                                        imageFocusToObjectPosition(
                                                            cardImagePosition
                                                        ),
                                                    display: "block",
                                                }}
                                            />

                                            {cardOverlayGradient && (
                                                <div
                                                    aria-hidden="true"
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,${clampedOverlay}) 100%)`,
                                                        pointerEvents: "none",
                                                    }}
                                                />
                                            )}

                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent:
                                                        cardTextLayout.justifyContent,
                                                    alignItems:
                                                        cardTextLayout.alignItems,
                                                    padding: cardPadding,
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 4,
                                                        alignItems:
                                                            cardTextLayout.alignItems,
                                                        textAlign:
                                                            cardTextLayout.textAlign,
                                                        maxWidth: "100%",
                                                    }}
                                                >
                                                    {member.name && (
                                                        <span
                                                            style={{
                                                                color:
                                                                    member.nameColor ||
                                                                    cardTextColor,
                                                                ...nameFont,
                                                            }}
                                                        >
                                                            {member.name}
                                                        </span>
                                                    )}
                                                    {member.position && (
                                                        <span
                                                            style={{
                                                                color:
                                                                    member.positionColor ||
                                                                    cardTextColor,
                                                                ...positionFont,
                                                                opacity: 0.9,
                                                            }}
                                                        >
                                                            {member.position}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.button>
                                )
                            })}
                        </div>
                    )
                })}
            </div>

            <AnimatePresence>
                {activeMember && (
                    <motion.div
                        key="trg-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => setActiveKey(null)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: modalBackdropColor,
                            backdropFilter: `blur(${modalBackdropBlur}px)`,
                            WebkitBackdropFilter: `blur(${modalBackdropBlur}px)`,
                            zIndex: 9999,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 24,
                        }}
                    >
                        <motion.div
                            key="trg-modal"
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            transition={{
                                duration: 0.35,
                                ease: [0.25, 0.1, 0.25, 1],
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: "relative",
                                width: isMobile ? "100%" : `${modalWidth}px`,
                                maxWidth: "calc(100vw - 48px)",
                                height: isMobile ? "auto" : `${modalHeight}px`,
                                maxHeight: "calc(100vh - 48px)",
                                borderRadius: modalBorderRadius,
                                overflow: "hidden",
                                backgroundColor: modalBackgroundColor,
                            }}
                        >
                            {activeMember.photo &&
                                activeMember.photo.src && (
                                    <img
                                        src={activeMember.photo.src}
                                        alt={
                                            activeMember.photo.alt ||
                                            activeMember.name ||
                                            ""
                                        }
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition:
                                                imageFocusToObjectPosition(
                                                    modalImagePosition
                                                ),
                                            display: "block",
                                            filter: modalImageDesaturate
                                                ? "grayscale(1)"
                                                : "none",
                                            WebkitMaskImage: modalImageMask,
                                            maskImage: modalImageMask,
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}

                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setActiveKey(null)}
                                style={{
                                    position: "absolute",
                                    top: 20,
                                    right: 20,
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    background: modalCloseBackground,
                                    border: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: modalCloseColor,
                                    zIndex: 3,
                                    padding: 0,
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                }}
                            >
                                <X size={20} />
                            </button>

                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent:
                                        modalTextLayout.justifyContent,
                                    alignItems: modalTextLayout.alignItems,
                                    padding: modalPadding,
                                    pointerEvents: "none",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 16,
                                        alignItems: modalTextLayout.alignItems,
                                        textAlign: modalTextLayout.textAlign,
                                        maxWidth: "min(560px, 100%)",
                                        maxHeight: "100%",
                                        overflowY: "auto",
                                        pointerEvents: "auto",
                                    }}
                                >
                                    {activeMember.modalHeading && (
                                        <span
                                            style={{
                                                color: modalTextColor,
                                                ...modalHeadingFont,
                                            }}
                                        >
                                            {activeMember.modalHeading}
                                        </span>
                                    )}
                                    {activeMember.modalDescription && (
                                        <div
                                            style={{
                                                color: modalTextColor,
                                                ...modalBodyFont,
                                                whiteSpace: "pre-wrap",
                                                opacity: 0.92,
                                            }}
                                        >
                                            {activeMember.modalDescription}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const memberObjectControl = {
    type: ControlType.Object,
    controls: {
        photo: {
            type: ControlType.ResponsiveImage,
            title: "Photo",
        },
        name: {
            type: ControlType.String,
            title: "Name",
            defaultValue: "First Last",
        },
        position: {
            type: ControlType.String,
            title: "Position",
            defaultValue: "Role / Title",
        },
        nameColor: {
            type: ControlType.Color,
            title: "Name Color",
            defaultValue: "#FFFFFF",
        },
        positionColor: {
            type: ControlType.Color,
            title: "Position Color",
            defaultValue: "#FFFFFF",
        },
        modalHeading: {
            type: ControlType.String,
            title: "Modal Heading",
            defaultValue: "",
            placeholder: "e.g. Lead Therapist, LCSW",
            displayTextArea: false,
        },
        modalDescription: {
            type: ControlType.String,
            title: "Modal Description",
            defaultValue: "",
            placeholder: "Full bio shown in the modal…",
            displayTextArea: true,
        },
    },
} as const

const defaultMember = {
    photo: {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Team member",
    },
    name: "First Last",
    position: "Role / Title",
    nameColor: "#FFFFFF",
    positionColor: "#FFFFFF",
    modalHeading: "",
    modalDescription: "",
}

addPropertyControls(TeamRevealGrid, {
    rows: {
        type: ControlType.Array,
        title: "Rows",
        control: {
            type: ControlType.Object,
            controls: {
                members: {
                    type: ControlType.Array,
                    title: "Cards (1–3)",
                    maxCount: 3,
                    control: memberObjectControl,
                    defaultValue: [defaultMember],
                },
            },
        },
        defaultValue: [
            {
                members: [
                    {
                        photo: {
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            alt: "Member 1",
                        },
                        name: "Jordan Avery",
                        position: "Founder & Clinical Director",
                        nameColor: "#FFFFFF",
                        positionColor: "#FFFFFF",
                        modalHeading:
                            "Twenty years of trauma-informed clinical care.",
                        modalDescription:
                            "Jordan founded Monarch on the belief that recovery is built on relationship.\n\nHer clinical background spans inpatient, outpatient, and community-based settings, with a focus on co-occurring disorders.",
                    },
                    {
                        photo: {
                            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                            alt: "Member 2",
                        },
                        name: "Marcus Reyes",
                        position: "Director of Admissions",
                        nameColor: "#FFFFFF",
                        positionColor: "#FFFFFF",
                        modalHeading:
                            "First point of contact for every referral.",
                        modalDescription:
                            "Marcus leads our admissions team and personally reviews every referral that comes through our partner network.",
                    },
                    {
                        photo: {
                            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                            alt: "Member 3",
                        },
                        name: "Priya Shah",
                        position: "Lead Therapist, LMHC",
                        nameColor: "#FFFFFF",
                        positionColor: "#FFFFFF",
                        modalHeading:
                            "Cognitive-behavioral and somatic-informed care.",
                        modalDescription:
                            "Priya specializes in early-recovery stabilization and family-systems work.",
                    },
                ],
            },
        ],
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 320,
        min: 200,
        max: 640,
        step: 8,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 400,
        min: 240,
        max: 720,
        step: 8,
        unit: "px",
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 4,
        unit: "px",
    },
    rowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        defaultValue: 24,
        min: 0,
        max: 120,
        step: 4,
        unit: "px",
    },
    rowAlignment: {
        type: ControlType.Enum,
        title: "Row Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },

    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 48,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        defaultValue: 32,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
    },
    cardImagePosition: {
        type: ControlType.Enum,
        title: "Card Image Focus",
        options: ["top", "center", "bottom", "left", "right"],
        optionTitles: ["Top", "Center", "Bottom", "Left", "Right"],
        defaultValue: "center",
    },
    cardTextPosition: {
        type: ControlType.Enum,
        title: "Card Text Position",
        options: [
            "top-left",
            "top-center",
            "top-right",
            "center-left",
            "center",
            "center-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
        ],
        optionTitles: [
            "Top Left",
            "Top Center",
            "Top Right",
            "Center Left",
            "Center",
            "Center Right",
            "Bottom Left",
            "Bottom Center",
            "Bottom Right",
        ],
        defaultValue: "bottom-left",
    },
    cardTextColor: {
        type: ControlType.Color,
        title: "Card Text Color",
        defaultValue: "#FFFFFF",
    },
    cardOverlayGradient: {
        type: ControlType.Boolean,
        title: "Card Gradient",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cardOverlayStrength: {
        type: ControlType.Number,
        title: "Card Gradient Strength",
        defaultValue: 0.45,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ cardOverlayGradient }) => !cardOverlayGradient,
    },

    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    positionFont: {
        type: ControlType.Font,
        title: "Position Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1.3em",
        },
    },

    dimOpacity: {
        type: ControlType.Number,
        title: "Dim Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },
    blurStrength: {
        type: ControlType.Number,
        title: "Blur Strength",
        defaultValue: 6,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.03,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    enableAppearAnimation: {
        type: ControlType.Boolean,
        title: "Appear Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.12,
        min: 0,
        max: 0.5,
        step: 0.02,
        unit: "s",
    },
    hoverAnimationDuration: {
        type: ControlType.Number,
        title: "Hover Anim Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },

    sectionPadding: {
        type: ControlType.Number,
        title: "Section Padding",
        defaultValue: 80,
        min: 0,
        max: 200,
        step: 8,
        unit: "px",
    },
    sectionRadius: {
        type: ControlType.Number,
        title: "Section Radius",
        defaultValue: 0,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },

    modalWidth: {
        type: ControlType.Number,
        title: "Modal Width",
        defaultValue: 960,
        min: 480,
        max: 1600,
        step: 20,
        unit: "px",
    },
    modalHeight: {
        type: ControlType.Number,
        title: "Modal Height",
        defaultValue: 640,
        min: 320,
        max: 1200,
        step: 20,
        unit: "px",
    },
    modalBorderRadius: {
        type: ControlType.Number,
        title: "Modal Radius",
        defaultValue: 48,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    modalPadding: {
        type: ControlType.Number,
        title: "Modal Padding",
        defaultValue: 48,
        min: 16,
        max: 96,
        step: 4,
        unit: "px",
    },
    modalBackgroundColor: {
        type: ControlType.Color,
        title: "Modal Background",
        defaultValue: "#F5F2EE",
    },
    modalImagePosition: {
        type: ControlType.Enum,
        title: "Modal Image Focus",
        options: ["top", "center", "bottom", "left", "right"],
        optionTitles: ["Top", "Center", "Bottom", "Left", "Right"],
        defaultValue: "center",
    },
    modalImageStartOpacity: {
        type: ControlType.Number,
        title: "Image Start Opacity",
        description:
            "Image opacity at the top of the modal. Fades to 0 by the Fade Point.",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },
    modalImageFadePoint: {
        type: ControlType.Number,
        title: "Image Fade Point",
        description:
            "Where the image is fully transparent. 1.0 = at the bottom edge of the modal. Lower values fade out sooner.",
        defaultValue: 1,
        min: 0.2,
        max: 1,
        step: 0.05,
    },
    modalImageDesaturate: {
        type: ControlType.Boolean,
        title: "Desaturate Image",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    modalTextPosition: {
        type: ControlType.Enum,
        title: "Modal Text Position",
        options: [
            "top-left",
            "top-center",
            "top-right",
            "center-left",
            "center",
            "center-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
        ],
        optionTitles: [
            "Top Left",
            "Top Center",
            "Top Right",
            "Center Left",
            "Center",
            "Center Right",
            "Bottom Left",
            "Bottom Center",
            "Bottom Right",
        ],
        defaultValue: "bottom-left",
    },
    modalTextColor: {
        type: ControlType.Color,
        title: "Modal Text Color",
        defaultValue: "#1D1D1F",
    },

    modalHeadingFont: {
        type: ControlType.Font,
        title: "Modal Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    modalBodyFont: {
        type: ControlType.Font,
        title: "Modal Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.55em",
        },
    },

    modalBackdropColor: {
        type: ControlType.Color,
        title: "Backdrop Color",
        defaultValue: "rgba(20,20,20,0.55)",
    },
    modalBackdropBlur: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    modalCloseColor: {
        type: ControlType.Color,
        title: "Close Icon Color",
        defaultValue: "#FFFFFF",
    },
    modalCloseBackground: {
        type: ControlType.Color,
        title: "Close BG",
        defaultValue: "rgba(0,0,0,0.55)",
    },
})
