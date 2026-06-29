// Grid Reveal — fixed 3-column row on desktop (collapses to 1 column on mobile).
// Hover one card to focus it; the other cards dim and blur. No hover = all sharp.
// Each card can use either an image or a solid color fill, and either an
// uploaded logo or a Lucide icon (or nothing).
//
// Made by Detailed (detailed.ch) with Framer Workshop · V2.5 (Monarch)

import { motion, useInView } from "framer-motion"
import {
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type ComponentType,
    type SVGProps,
    useEffect,
} from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { icons } from "lucide-react"

type LucideIconComponent = ComponentType<
    SVGProps<SVGSVGElement> & {
        size?: number | string
        color?: string
        strokeWidth?: number | string
        absoluteStrokeWidth?: boolean
    }
>

function resolveLucideIcon(
    rawName: string | undefined | null
): LucideIconComponent | null {
    if (!rawName) return null
    const dict = icons as Record<string, LucideIconComponent>
    const trimmed = rawName.trim()
    if (!trimmed) return null
    if (dict[trimmed]) return dict[trimmed]
    const pascal = trimmed
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map(
            (part) =>
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join("")
    if (dict[pascal]) return dict[pascal]
    const lowerKey = trimmed.toLowerCase().replace(/[-_\s]+/g, "")
    for (const key of Object.keys(dict)) {
        if (key.toLowerCase() === lowerKey) return dict[key]
    }
    return null
}

interface Project {
    fillMode: "image" | "color"
    fillColor: string
    image: { src: string; alt: string }
    logoSource: "image" | "icon" | "none"
    logo: { src: string; alt: string }
    iconName: string
    iconColor: string
    iconStrokeWidth: number
    title: string
    text: string
    enableLink: boolean
    link: string
    openInNewTab: boolean
    useLogoColorFilter: boolean
    invertLogoColor: boolean
    titleColor: string
    textColor: string
    useBackground: boolean
    backgroundColorWithOpacity: string
    backgroundPadding: number
    backgroundRadius: number
}

interface ProjectShowcaseProps {
    projects: Project[]
    backgroundColor: string
    overlayColor: string
    titleFont: CSSProperties
    textFont: CSSProperties
    cardRadius: number
    cardGap: number
    cardAspectRatio: number
    maxRowWidth: number
    sectionRadius: number
    animationDuration: number
    staggerDelay: number
    hoverScale: number
    hoverAnimationDuration: number
    dimOpacity: number
    blurStrength: number
    logoSize: number
    logoPosition:
        | "bottom-left"
        | "bottom-right"
        | "top-left"
        | "top-right"
        | "center"
    logoVisibility: "always" | "hover"
    logoFadeDelay: number
    enableAppearAnimation: boolean
    sectionPadding: number
    contentAlignment: "left" | "center" | "right"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function GridReveal(props: ProjectShowcaseProps) {
    const {
        projects,
        backgroundColor,
        titleFont,
        textFont,
        cardRadius,
        cardGap,
        cardAspectRatio,
        maxRowWidth,
        sectionRadius,
        animationDuration,
        staggerDelay,
        hoverScale,
        hoverAnimationDuration,
        dimOpacity,
        blurStrength,
        logoSize,
        logoPosition,
        logoVisibility,
        logoFadeDelay,
        enableAppearAnimation,
        sectionPadding,
        contentAlignment,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [activeIndexMobile, setActiveIndexMobile] = useState<number | null>(
        null
    )
    const [isMobile, setIsMobile] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })
    const isStatic = useIsStaticRenderer()

    const normalizeUrl = (url: string): string => {
        if (!url || url === "#") return "#"
        if (url.startsWith("/")) return url
        if (url.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) return url
        return `https://${url}`
    }

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
        if (!isMobile || isStatic || typeof window === "undefined") return
        const handleScroll = () => {
            const viewportCenter = window.innerHeight / 2
            let closestIndex = -1
            let closestDistance = Infinity
            cardRefs.current.forEach((card, index) => {
                if (!card) return
                const rect = card.getBoundingClientRect()
                const cardCenter = rect.top + rect.height / 2
                const distance = Math.abs(cardCenter - viewportCenter)
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    if (distance < closestDistance) {
                        closestDistance = distance
                        closestIndex = index
                    }
                }
            })
            const nextActive: number | null =
                closestIndex < 0 ? null : closestIndex
            if (nextActive !== activeIndexMobile) {
                startTransition(() => setActiveIndexMobile(nextActive))
            }
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener("scroll", handleScroll)
    }, [isMobile, isStatic, activeIndexMobile])

    const isFixedHeight = props?.style?.height === "100%"

    const defaultImage = {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Default Project Image",
    }

    const clampedDim = Math.max(0, Math.min(1, dimOpacity ?? 0.6))
    const clampedBlur = Math.max(0, blurStrength ?? 5)

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
                    gridTemplateColumns: isMobile
                        ? "1fr"
                        : "repeat(3, minmax(0, 1fr))",
                    gap: `${cardGap}px`,
                    maxWidth: maxRowWidth,
                    margin: "0 auto",
                }}
            >
                {projects.map((project, index) => {
                    const image = project.image || defaultImage
                    const logo = project.logo
                    const fillMode = project.fillMode || "image"
                    const fillColor = project.fillColor || "#2B2828"
                    const logoSource =
                        project.logoSource ??
                        (logo && logo.src && logo.src.trim() !== ""
                            ? "image"
                            : "none")
                    const hasLogoImage =
                        logoSource === "image" &&
                        logo &&
                        logo.src &&
                        logo.src.trim() !== ""
                    const IconComponent =
                        logoSource === "icon"
                            ? (resolveLucideIcon(project.iconName) ??
                              (icons as Record<string, LucideIconComponent>)
                                  .HelpCircle)
                            : null
                    const iconColor = project.iconColor || "#FFFFFF"
                    const iconStrokeWidth = project.iconStrokeWidth ?? 2
                    const isActiveOnMobile =
                        isMobile && activeIndexMobile === index
                    const shouldShowHoverEffect = isMobile
                        ? isActiveOnMobile
                        : hoveredIndex === index

                    const focusedThisCard = isMobile
                        ? activeIndexMobile === null ||
                          activeIndexMobile === index
                        : hoveredIndex === null || hoveredIndex === index

                    return (
                        <motion.a
                            key={index}
                            ref={(el) => {
                                cardRefs.current[index] = el
                            }}
                            href={
                                project.enableLink
                                    ? normalizeUrl(project.link || "#")
                                    : undefined
                            }
                            target={
                                project.enableLink && project.openInNewTab
                                    ? "_blank"
                                    : "_self"
                            }
                            rel={
                                project.enableLink && project.openInNewTab
                                    ? "noopener noreferrer"
                                    : undefined
                            }
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
                            style={{
                                position: "relative",
                                aspectRatio: `${cardAspectRatio}`,
                                minWidth: 200,
                                cursor: project.enableLink
                                    ? "pointer"
                                    : "default",
                                borderRadius: cardRadius,
                                overflow: "hidden",
                                textDecoration: "none",
                                display: "block",
                            }}
                            onMouseEnter={() =>
                                !isMobile &&
                                startTransition(() => setHoveredIndex(index))
                            }
                            onMouseLeave={() =>
                                !isMobile &&
                                startTransition(() => setHoveredIndex(null))
                            }
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
                                {fillMode === "color" ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: fillColor,
                                        }}
                                        aria-label={project.title || undefined}
                                        role="img"
                                    />
                                ) : (
                                    <img
                                        src={image.src}
                                        alt={image.alt}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                )}

                                <motion.div
                                    initial={
                                        isStatic
                                            ? { opacity: 1 }
                                            : { opacity: 0 }
                                    }
                                    animate={
                                        isStatic
                                            ? { opacity: 1 }
                                            : isInView
                                              ? logoVisibility === "hover"
                                                  ? {
                                                        opacity:
                                                            shouldShowHoverEffect
                                                                ? 1
                                                                : 0,
                                                    }
                                                  : { opacity: 1 }
                                              : { opacity: 0 }
                                    }
                                    transition={{
                                        duration:
                                            logoVisibility === "hover"
                                                ? 0.4
                                                : 0.5,
                                        delay: logoFadeDelay,
                                        ease: [0.25, 0.1, 0.25, 1],
                                    }}
                                    style={{
                                        position: "absolute",
                                        ...(logoPosition === "bottom-left" && {
                                            bottom: 24,
                                            left: 24,
                                        }),
                                        ...(logoPosition === "bottom-right" && {
                                            bottom: 24,
                                            right: 24,
                                        }),
                                        ...(logoPosition === "top-left" && {
                                            top: 24,
                                            left: 24,
                                        }),
                                        ...(logoPosition === "top-right" && {
                                            top: 24,
                                            right: 24,
                                        }),
                                        ...(logoPosition === "center" && {
                                            top: "50%",
                                            left: "50%",
                                            transform: "translate(-50%, -50%)",
                                        }),
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 12,
                                        alignItems:
                                            contentAlignment === "left"
                                                ? "flex-start"
                                                : contentAlignment === "center"
                                                  ? "center"
                                                  : "flex-end",
                                        textAlign: contentAlignment,
                                        ...(project.useBackground && {
                                            backgroundColor:
                                                project.backgroundColorWithOpacity ||
                                                "rgba(0, 0, 0, 0.5)",
                                            padding: `${project.backgroundPadding || 16}px`,
                                            borderRadius: `${project.backgroundRadius || 8}px`,
                                        }),
                                    }}
                                >
                                    {hasLogoImage && (
                                        <motion.img
                                            src={logo.src}
                                            alt={logo.alt}
                                            animate={
                                                isStatic
                                                    ? { opacity: 0.8 }
                                                    : {
                                                          opacity:
                                                              logoVisibility ===
                                                                  "always" &&
                                                              shouldShowHoverEffect
                                                                  ? 1
                                                                  : logoVisibility ===
                                                                      "always"
                                                                    ? 0.8
                                                                    : 1,
                                                      }
                                            }
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                width: "auto",
                                                height: logoSize,
                                                objectFit: "contain",
                                                filter: project.useLogoColorFilter
                                                    ? project.invertLogoColor
                                                        ? "brightness(0) invert(1)"
                                                        : "brightness(0)"
                                                    : "none",
                                            }}
                                        />
                                    )}
                                    {logoSource === "icon" && IconComponent && (
                                        <motion.span
                                            animate={
                                                isStatic
                                                    ? { opacity: 0.9 }
                                                    : {
                                                          opacity:
                                                              logoVisibility ===
                                                                  "always" &&
                                                              shouldShowHoverEffect
                                                                  ? 1
                                                                  : logoVisibility ===
                                                                      "always"
                                                                    ? 0.9
                                                                    : 1,
                                                      }
                                            }
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                lineHeight: 0,
                                                color: iconColor,
                                            }}
                                            aria-hidden="true"
                                        >
                                            <IconComponent
                                                size={logoSize}
                                                color={iconColor}
                                                strokeWidth={iconStrokeWidth}
                                            />
                                        </motion.span>
                                    )}
                                    <span
                                        style={{
                                            color:
                                                project.titleColor || "#FFFFFF",
                                            ...titleFont,
                                        }}
                                    >
                                        {project.title}
                                    </span>
                                    {project.text && (
                                        <span
                                            style={{
                                                color:
                                                    project.textColor ||
                                                    "#FFFFFF",
                                                ...textFont,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {project.text}
                                        </span>
                                    )}
                                </motion.div>

                                <motion.div
                                    animate={{
                                        opacity: shouldShowHoverEffect
                                            ? 0.08
                                            : 0,
                                    }}
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        boxShadow:
                                            "0 20px 60px rgba(0,0,0,0.3)",
                                        pointerEvents: "none",
                                    }}
                                />
                            </motion.div>
                        </motion.a>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(GridReveal, {
    projects: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                fillMode: {
                    type: ControlType.Enum,
                    title: "Fill",
                    options: ["image", "color"],
                    optionTitles: ["Image", "Color"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: ({ fillMode }) => fillMode === "color",
                },
                fillColor: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#2B2828",
                    hidden: ({ fillMode }) => fillMode !== "color",
                },
                logoSource: {
                    type: ControlType.Enum,
                    title: "Logo Source",
                    options: ["image", "icon", "none"],
                    optionTitles: ["Image", "Icon", "None"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                logo: {
                    type: ControlType.ResponsiveImage,
                    title: "Logo",
                    hidden: ({ logoSource }) =>
                        logoSource && logoSource !== "image",
                },
                useLogoColorFilter: {
                    type: ControlType.Boolean,
                    title: "Logo Color Filter",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    hidden: ({ logoSource }) =>
                        logoSource && logoSource !== "image",
                },
                invertLogoColor: {
                    type: ControlType.Boolean,
                    title: "Invert Color",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    hidden: ({ logoSource, useLogoColorFilter }) =>
                        (logoSource && logoSource !== "image") ||
                        !useLogoColorFilter,
                },
                iconName: {
                    type: ControlType.String,
                    title: "Icon Name",
                    defaultValue: "Star",
                    description:
                        "Lucide icon name from lucide.dev/icons. Any casing works: 'brain', 'Brain', 'arrow-right', or 'ArrowRight'.",
                    placeholder: "brain",
                    hidden: ({ logoSource }) => logoSource !== "icon",
                },
                iconColor: {
                    type: ControlType.Color,
                    title: "Icon Color",
                    defaultValue: "#FFFFFF",
                    hidden: ({ logoSource }) => logoSource !== "icon",
                },
                iconStrokeWidth: {
                    type: ControlType.Number,
                    title: "Icon Stroke",
                    defaultValue: 2,
                    min: 0.5,
                    max: 4,
                    step: 0.25,
                    hidden: ({ logoSource }) => logoSource !== "icon",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                text: {
                    type: ControlType.String,
                    title: "Text Field",
                    defaultValue: "",
                },
                titleColor: {
                    type: ControlType.Color,
                    title: "Title Color",
                    defaultValue: "#FFFFFF",
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#FFFFFF",
                },
                useBackground: {
                    type: ControlType.Boolean,
                    title: "Use Background",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
                backgroundColorWithOpacity: {
                    type: ControlType.Color,
                    title: "Background Color",
                    defaultValue: "rgba(0, 0, 0, 0.5)",
                    hidden: ({ useBackground }) => !useBackground,
                },
                backgroundPadding: {
                    type: ControlType.Number,
                    title: "Background Padding",
                    defaultValue: 16,
                    min: 0,
                    max: 40,
                    step: 2,
                    unit: "px",
                    hidden: ({ useBackground }) => !useBackground,
                },
                backgroundRadius: {
                    type: ControlType.Number,
                    title: "Background Radius",
                    defaultValue: 8,
                    min: 0,
                    max: 32,
                    step: 1,
                    unit: "px",
                    hidden: ({ useBackground }) => !useBackground,
                },
                enableLink: {
                    type: ControlType.Boolean,
                    title: "Link",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    hidden: ({ enableLink }) => !enableLink,
                },
                openInNewTab: {
                    type: ControlType.Boolean,
                    title: "Open in New Tab",
                    defaultValue: true,
                    enabledTitle: "New Tab",
                    disabledTitle: "Same Tab",
                    hidden: ({ enableLink }) => !enableLink,
                },
            },
        },
        defaultValue: [
            {
                fillMode: "image",
                fillColor: "#2B2828",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Project 1",
                },
                logoSource: "image",
                logo: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Logo 1",
                },
                iconName: "Sparkles",
                iconColor: "#FFFFFF",
                iconStrokeWidth: 2,
                title: "Vision",
                text: "",
                useLogoColorFilter: true,
                invertLogoColor: true,
                titleColor: "#FFFFFF",
                textColor: "#FFFFFF",
                useBackground: false,
                backgroundColorWithOpacity: "rgba(0, 0, 0, 0.5)",
                backgroundPadding: 16,
                backgroundRadius: 8,
                enableLink: false,
                link: "",
                openInNewTab: true,
            },
            {
                fillMode: "image",
                fillColor: "#7B9AAB",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Project 2",
                },
                logoSource: "image",
                logo: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Logo 2",
                },
                iconName: "Hammer",
                iconColor: "#FFFFFF",
                iconStrokeWidth: 2,
                title: "Craft",
                text: "",
                useLogoColorFilter: true,
                invertLogoColor: true,
                titleColor: "#FFFFFF",
                textColor: "#FFFFFF",
                useBackground: false,
                backgroundColorWithOpacity: "rgba(0, 0, 0, 0.5)",
                backgroundPadding: 16,
                backgroundRadius: 8,
                enableLink: false,
                link: "",
                openInNewTab: true,
            },
            {
                fillMode: "image",
                fillColor: "#F48375",
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Project 3",
                },
                logoSource: "image",
                logo: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Logo 3",
                },
                iconName: "Target",
                iconColor: "#FFFFFF",
                iconStrokeWidth: 2,
                title: "Precision",
                text: "",
                useLogoColorFilter: true,
                invertLogoColor: true,
                titleColor: "#FFFFFF",
                textColor: "#FFFFFF",
                useBackground: false,
                backgroundColorWithOpacity: "rgba(0, 0, 0, 0.5)",
                backgroundPadding: 16,
                backgroundRadius: 8,
                enableLink: false,
                link: "",
                openInNewTab: true,
            },
        ],
    },
    logoVisibility: {
        type: ControlType.Enum,
        title: "Show Logo / Text",
        options: ["always", "hover"],
        optionTitles: ["Always", "Hover"],
        defaultValue: "always",
        displaySegmentedControl: true,
    },
    logoFadeDelay: {
        type: ControlType.Number,
        title: "Logo Fade Delay",
        defaultValue: 0.1,
        min: 0,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    enableAppearAnimation: {
        type: ControlType.Boolean,
        title: "Appear Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    contentAlignment: {
        type: ControlType.Enum,
        title: "Alignment Logo / Text",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    logoPosition: {
        type: ControlType.Enum,
        title: "Positioning Logo / Text",
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
        displaySegmentedControl: false,
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
    sectionRadius: {
        type: ControlType.Number,
        title: "Section Radius",
        defaultValue: 0,
        min: 0,
        max: 80,
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
    sectionPadding: {
        type: ControlType.Number,
        title: "Section Padding",
        defaultValue: 80,
        min: 0,
        max: 200,
        step: 8,
        unit: "px",
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
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.03,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    hoverAnimationDuration: {
        type: ControlType.Number,
        title: "Hover Animation Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
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
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 32,
        min: 16,
        max: 80,
        step: 4,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
