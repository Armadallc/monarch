// Team Reveal — Grid of team-member cards. Default state: every card is in
// focus. On hover, the hovered card stays sharp while the others dim and blur
// (matches GridReveal). Click a card to open a full bio modal with photo,
// name, position, headline, and body copy (matches ProductCard modal pattern).
//
// Grid scales by `cardsPerRow` (1–3 on desktop, always 1 on mobile). The
// number of rows is implicit from the length of the `members` array.
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

interface TeamMember {
    photo: { src: string; alt: string }
    name: string
    position: string
    nameColor: string
    positionColor: string
    bioHeading: string
    bio: string
    useCardTextBackground: boolean
    cardTextBackgroundColor: string
}

interface TeamRevealProps {
    members: TeamMember[]

    cardsPerRow: number
    cardRadius: number
    cardGap: number
    cardAspectRatio: number
    maxRowWidth: number
    sectionRadius: number
    sectionPadding: number
    backgroundColor: string

    namePosition:
        | "bottom-left"
        | "bottom-right"
        | "top-left"
        | "top-right"
        | "center"
    nameAlignment: "left" | "center" | "right"
    nameFont: CSSProperties
    positionFont: CSSProperties
    textBackgroundPadding: number
    textBackgroundRadius: number

    dimOpacity: number
    blurStrength: number
    hoverScale: number
    enableAppearAnimation: boolean
    animationDuration: number
    staggerDelay: number
    hoverAnimationDuration: number

    modalBackgroundColor: string
    modalBorderRadius: number
    modalPadding: number
    modalMaxWidth: number
    modalLayout: "stack" | "split"
    modalImageAspectRatio: number
    modalImageRadius: number
    modalNameColor: string
    modalPositionColor: string
    modalHeadingColor: string
    modalBodyColor: string
    modalNameFont: CSSProperties
    modalPositionFont: CSSProperties
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

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function TeamReveal(props: TeamRevealProps) {
    const {
        members,
        cardsPerRow,
        cardRadius,
        cardGap,
        cardAspectRatio,
        maxRowWidth,
        sectionRadius,
        sectionPadding,
        backgroundColor,
        namePosition,
        nameAlignment,
        nameFont,
        positionFont,
        textBackgroundPadding,
        textBackgroundRadius,
        dimOpacity,
        blurStrength,
        hoverScale,
        enableAppearAnimation,
        animationDuration,
        staggerDelay,
        hoverAnimationDuration,
        modalBackgroundColor,
        modalBorderRadius,
        modalPadding,
        modalMaxWidth,
        modalLayout,
        modalImageAspectRatio,
        modalImageRadius,
        modalNameColor,
        modalPositionColor,
        modalHeadingColor,
        modalBodyColor,
        modalNameFont,
        modalPositionFont,
        modalHeadingFont,
        modalBodyFont,
        modalBackdropColor,
        modalBackdropBlur,
        modalCloseColor,
        modalCloseBackground,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })
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
            if (e.key === "Escape") setActiveIndex(null)
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    useEffect(() => {
        if (typeof document === "undefined") return
        if (activeIndex === null) return
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [activeIndex])

    const clampedDim = Math.max(0, Math.min(1, dimOpacity ?? 0.6))
    const clampedBlur = Math.max(0, blurStrength ?? 5)
    const columns = Math.max(1, Math.min(3, Math.round(cardsPerRow || 3)))
    const gridCols = isMobile ? "1fr" : `repeat(${columns}, minmax(0, 1fr))`

    const isFixedHeight = props?.style?.height === "100%"
    const activeMember =
        activeIndex !== null && activeIndex < members.length
            ? members[activeIndex]
            : null

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
                    display: "grid",
                    gridTemplateColumns: gridCols,
                    gap: `${cardGap}px`,
                    maxWidth: maxRowWidth,
                    margin: "0 auto",
                }}
            >
                {members.map((member, index) => {
                    const photo = member.photo || FALLBACK_PHOTO
                    const focusedThisCard = isStatic
                        ? true
                        : hoveredIndex === null || hoveredIndex === index
                    const useTextBackground = !!member.useCardTextBackground
                    const cardTextBackground =
                        member.cardTextBackgroundColor || "rgba(0,0,0,0.5)"

                    return (
                        <motion.button
                            key={index}
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
                                    ? index * staggerDelay
                                    : 0,
                                ease: [0.25, 0.1, 0.25, 1],
                            }}
                            onMouseEnter={() =>
                                !isMobile &&
                                startTransition(() => setHoveredIndex(index))
                            }
                            onMouseLeave={() =>
                                !isMobile &&
                                startTransition(() => setHoveredIndex(null))
                            }
                            onClick={() => setActiveIndex(index)}
                            whileHover={
                                isStatic || isMobile
                                    ? {}
                                    : {
                                          scale: hoverScale,
                                          transition: {
                                              duration: hoverAnimationDuration,
                                              ease: [0.25, 0.1, 0.25, 1],
                                          },
                                      }
                            }
                            whileTap={
                                isStatic || isMobile
                                    ? {}
                                    : {
                                          scale: 0.98,
                                          transition: { duration: 0.15 },
                                      }
                            }
                            style={{
                                position: "relative",
                                aspectRatio: `${cardAspectRatio}`,
                                minWidth: 200,
                                cursor: "pointer",
                                borderRadius: cardRadius,
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
                                              opacity: focusedThisCard
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
                                    alt={photo.alt || member.name || ""}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />

                                <motion.div
                                    initial={
                                        isStatic ? { opacity: 1 } : { opacity: 0 }
                                    }
                                    animate={
                                        isStatic
                                            ? { opacity: 1 }
                                            : isInView
                                              ? { opacity: 1 }
                                              : { opacity: 0 }
                                    }
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.1,
                                        ease: [0.25, 0.1, 0.25, 1],
                                    }}
                                    style={{
                                        position: "absolute",
                                        ...(namePosition === "bottom-left" && {
                                            bottom: 24,
                                            left: 24,
                                        }),
                                        ...(namePosition === "bottom-right" && {
                                            bottom: 24,
                                            right: 24,
                                        }),
                                        ...(namePosition === "top-left" && {
                                            top: 24,
                                            left: 24,
                                        }),
                                        ...(namePosition === "top-right" && {
                                            top: 24,
                                            right: 24,
                                        }),
                                        ...(namePosition === "center" && {
                                            top: "50%",
                                            left: "50%",
                                            transform: "translate(-50%, -50%)",
                                        }),
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4,
                                        alignItems:
                                            nameAlignment === "left"
                                                ? "flex-start"
                                                : nameAlignment === "center"
                                                  ? "center"
                                                  : "flex-end",
                                        textAlign: nameAlignment,
                                        ...(useTextBackground && {
                                            backgroundColor: cardTextBackground,
                                            padding: `${textBackgroundPadding}px`,
                                            borderRadius: `${textBackgroundRadius}px`,
                                        }),
                                    }}
                                >
                                    {member.name && (
                                        <span
                                            style={{
                                                color:
                                                    member.nameColor ||
                                                    "#FFFFFF",
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
                                                    "#FFFFFF",
                                                ...positionFont,
                                                opacity: 0.85,
                                            }}
                                        >
                                            {member.position}
                                        </span>
                                    )}
                                </motion.div>
                            </motion.div>
                        </motion.button>
                    )
                })}
            </div>

            <AnimatePresence>
                {activeMember && (
                    <motion.div
                        key="team-reveal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => setActiveIndex(null)}
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
                            key="team-reveal-modal"
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
                                width: "100%",
                                maxWidth: modalMaxWidth,
                                maxHeight: "90vh",
                                overflowY: "auto",
                                backgroundColor: modalBackgroundColor,
                                borderRadius: modalBorderRadius,
                                padding: modalPadding,
                                display: "flex",
                                flexDirection:
                                    modalLayout === "split" && !isMobile
                                        ? "row"
                                        : "column",
                                gap: 24,
                            }}
                        >
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setActiveIndex(null)}
                                style={{
                                    position: "absolute",
                                    top: 16,
                                    right: 16,
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    background: modalCloseBackground,
                                    border: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: modalCloseColor,
                                    zIndex: 2,
                                    padding: 0,
                                }}
                            >
                                <X size={18} />
                            </button>

                            {activeMember.photo && activeMember.photo.src && (
                                <div
                                    style={{
                                        position: "relative",
                                        ...(modalLayout === "split" && !isMobile
                                            ? {
                                                  flex: "0 0 45%",
                                                  alignSelf: "stretch",
                                              }
                                            : { width: "100%" }),
                                        aspectRatio:
                                            modalLayout === "split" && !isMobile
                                                ? "auto"
                                                : `${modalImageAspectRatio}`,
                                        borderRadius: modalImageRadius,
                                        overflow: "hidden",
                                        backgroundColor: "rgba(0,0,0,0.04)",
                                        minHeight: 240,
                                    }}
                                >
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
                                            display: "block",
                                        }}
                                    />
                                </div>
                            )}

                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                    minWidth: 0,
                                }}
                            >
                                {activeMember.name && (
                                    <span
                                        style={{
                                            color: modalNameColor,
                                            ...modalNameFont,
                                        }}
                                    >
                                        {activeMember.name}
                                    </span>
                                )}
                                {activeMember.position && (
                                    <span
                                        style={{
                                            color: modalPositionColor,
                                            ...modalPositionFont,
                                            opacity: 0.85,
                                        }}
                                    >
                                        {activeMember.position}
                                    </span>
                                )}
                                {activeMember.bioHeading && (
                                    <span
                                        style={{
                                            color: modalHeadingColor,
                                            ...modalHeadingFont,
                                            marginTop: 8,
                                        }}
                                    >
                                        {activeMember.bioHeading}
                                    </span>
                                )}
                                {activeMember.bio && (
                                    <div
                                        style={{
                                            color: modalBodyColor,
                                            ...modalBodyFont,
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {activeMember.bio}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(TeamReveal, {
    members: {
        type: ControlType.Array,
        title: "Members",
        control: {
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
                useCardTextBackground: {
                    type: ControlType.Boolean,
                    title: "Card Text BG",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
                cardTextBackgroundColor: {
                    type: ControlType.Color,
                    title: "Card BG Color",
                    defaultValue: "rgba(0,0,0,0.5)",
                    hidden: ({ useCardTextBackground }) =>
                        !useCardTextBackground,
                },
                bioHeading: {
                    type: ControlType.String,
                    title: "Modal Heading",
                    defaultValue: "",
                    placeholder: "e.g. Lead Therapist, LCSW",
                    displayTextArea: false,
                },
                bio: {
                    type: ControlType.String,
                    title: "Modal Bio",
                    defaultValue: "",
                    placeholder: "Full bio shown in the modal…",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                photo: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Member 1",
                },
                name: "Jordan Avery",
                position: "Founder & Clinical Director",
                nameColor: "#FFFFFF",
                positionColor: "#FFFFFF",
                useCardTextBackground: false,
                cardTextBackgroundColor: "rgba(0,0,0,0.5)",
                bioHeading: "Twenty years of trauma-informed clinical care.",
                bio: "Jordan founded Monarch on the belief that recovery is built on relationship.\n\nHer clinical background spans inpatient, outpatient, and community-based settings, with a focus on co-occurring disorders.",
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
                useCardTextBackground: false,
                cardTextBackgroundColor: "rgba(0,0,0,0.5)",
                bioHeading: "First point of contact for every referral.",
                bio: "Marcus leads our admissions team and personally reviews every referral that comes through our partner network.",
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
                useCardTextBackground: false,
                cardTextBackgroundColor: "rgba(0,0,0,0.5)",
                bioHeading: "Cognitive-behavioral and somatic-informed care.",
                bio: "Priya specializes in early-recovery stabilization and family-systems work.",
            },
        ],
    },

    cardsPerRow: {
        type: ControlType.Enum,
        title: "Cards per Row",
        options: [1, 2, 3],
        optionTitles: ["1", "2", "3"],
        defaultValue: 3,
        displaySegmentedControl: true,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
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
    cardAspectRatio: {
        type: ControlType.Number,
        title: "Card Aspect Ratio",
        defaultValue: 0.75,
        min: 0.5,
        max: 2,
        step: 0.05,
        displayStepper: true,
    },
    maxRowWidth: {
        type: ControlType.Number,
        title: "Max Row Width",
        defaultValue: 1400,
        min: 600,
        max: 2400,
        step: 20,
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
    sectionPadding: {
        type: ControlType.Number,
        title: "Section Padding",
        defaultValue: 80,
        min: 0,
        max: 200,
        step: 8,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },

    namePosition: {
        type: ControlType.Enum,
        title: "Name Position",
        options: [
            "bottom-left",
            "bottom-right",
            "top-left",
            "top-right",
            "center",
        ],
        optionTitles: [
            "Bottom Left",
            "Bottom Right",
            "Top Left",
            "Top Right",
            "Center",
        ],
        defaultValue: "bottom-left",
    },
    nameAlignment: {
        type: ControlType.Enum,
        title: "Name Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
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
    textBackgroundPadding: {
        type: ControlType.Number,
        title: "Text BG Padding",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
    },
    textBackgroundRadius: {
        type: ControlType.Number,
        title: "Text BG Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
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

    modalBackgroundColor: {
        type: ControlType.Color,
        title: "Modal BG",
        defaultValue: "#FFFFFF",
    },
    modalBorderRadius: {
        type: ControlType.Number,
        title: "Modal Radius",
        defaultValue: 32,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    modalPadding: {
        type: ControlType.Number,
        title: "Modal Padding",
        defaultValue: 40,
        min: 16,
        max: 80,
        step: 4,
        unit: "px",
    },
    modalMaxWidth: {
        type: ControlType.Number,
        title: "Modal Max Width",
        defaultValue: 880,
        min: 400,
        max: 1400,
        step: 20,
        unit: "px",
    },
    modalLayout: {
        type: ControlType.Enum,
        title: "Modal Layout",
        options: ["stack", "split"],
        optionTitles: ["Stack", "Split"],
        defaultValue: "split",
        displaySegmentedControl: true,
    },
    modalImageAspectRatio: {
        type: ControlType.Number,
        title: "Modal Img Ratio",
        defaultValue: 1.2,
        min: 0.5,
        max: 2.5,
        step: 0.05,
        displayStepper: true,
        hidden: ({ modalLayout }) => modalLayout === "split",
    },
    modalImageRadius: {
        type: ControlType.Number,
        title: "Modal Img Radius",
        defaultValue: 20,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    modalNameColor: {
        type: ControlType.Color,
        title: "Modal Name Color",
        defaultValue: "#1D1D1F",
    },
    modalPositionColor: {
        type: ControlType.Color,
        title: "Modal Position Color",
        defaultValue: "#1D1D1F",
    },
    modalHeadingColor: {
        type: ControlType.Color,
        title: "Modal Heading Color",
        defaultValue: "#1D1D1F",
    },
    modalBodyColor: {
        type: ControlType.Color,
        title: "Modal Body Color",
        defaultValue: "#3C3C43",
    },
    modalNameFont: {
        type: ControlType.Font,
        title: "Modal Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "28px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.15em",
        },
    },
    modalPositionFont: {
        type: ControlType.Font,
        title: "Modal Position Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1.3em",
        },
    },
    modalHeadingFont: {
        type: ControlType.Font,
        title: "Modal Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
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
        defaultValue: "rgba(20,20,20,0.5)",
    },
    modalBackdropBlur: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    modalCloseColor: {
        type: ControlType.Color,
        title: "Close Icon Color",
        defaultValue: "#1D1D1F",
    },
    modalCloseBackground: {
        type: ControlType.Color,
        title: "Close BG",
        defaultValue: "rgba(0,0,0,0.06)",
    },
})
