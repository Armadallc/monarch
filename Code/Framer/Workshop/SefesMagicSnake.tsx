// Sefe's Magic Snake — animated underline with pin-based growth and two preset states.
// Paste into Framer as a code component (Assets → Code → new file).

import * as React from "react"
import { useState } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion } from "framer-motion"

type Pin = "left" | "center" | "right"
type LengthPreset = "0" | "25" | "50" | "75" | "100" | "custom"
type CanvasState = "rest" | "active"
type TriggerMode = "hover" | "controlled"
type TransitionEase =
    | "linear"
    | "easeIn"
    | "easeOut"
    | "easeInOut"
    | [number, number, number, number]

const EASE_MAP: Record<string, TransitionEase> = {
    linear: "linear",
    easeIn: "easeIn",
    easeOut: "easeOut",
    easeInOut: "easeInOut",
    smooth: [0.44, 0, 0.22, 1],
    snappy: [0.22, 1, 0.36, 1],
}

const LENGTH_PRESET_OPTIONS = ["0", "25", "50", "75", "100", "custom"] as const
const LENGTH_PRESET_LABELS = ["0%", "25%", "50%", "75%", "100%", "Custom"]

function resolveColor(value: unknown, fallback: string): string {
    if (typeof value === "string" && value.trim()) return value
    if (value && typeof value === "object") {
        const c = value as Record<string, number>
        if (typeof c.r === "number" && typeof c.g === "number" && typeof c.b === "number") {
            const a = typeof c.a === "number" ? c.a : 1
            return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`
        }
    }
    return fallback
}

function lengthPresetToScale(preset: LengthPreset, customPercent: number): number {
    if (preset === "custom") {
        return Math.max(0, Math.min(100, customPercent)) / 100
    }
    return Number(preset) / 100
}

function pinToTransformOrigin(pin: Pin): string {
    if (pin === "left") return "left center"
    if (pin === "right") return "right center"
    return "center center"
}

function pinToFlexAlign(pin: Pin): React.CSSProperties["justifyContent"] {
    if (pin === "left") return "flex-start"
    if (pin === "right") return "flex-end"
    return "center"
}

interface StateConfig {
    lengthPreset: LengthPreset
    lengthCustom: number
    opacity: number
    color: string
}

interface SefesMagicSnakeProps {
    pin: Pin
    strokeWeight: number

    restLengthPreset: LengthPreset
    restLengthCustom: number
    restOpacity: number
    restColor: string

    activeLengthPreset: LengthPreset
    activeLengthCustom: number
    activeOpacity: number
    activeColor: string

    triggerMode: TriggerMode
    /** Controlled mode — set per variant on parent nav link (Default: off, Hover: on). */
    active: boolean
    /** Hover mode only — canvas/static preview; does not affect published Controlled instances. */
    canvasState: CanvasState
    /** Hover mode — invisible vertical slop above/below the stroke for pointer capture. */
    hitAreaPadding: number

    transitionDuration: number
    transitionEase: keyof typeof EASE_MAP

    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 18
 */
export default function SefesMagicSnake(props: SefesMagicSnakeProps) {
    const {
        pin,
        strokeWeight,
        restLengthPreset,
        restLengthCustom,
        restOpacity,
        restColor,
        activeLengthPreset,
        activeLengthCustom,
        activeOpacity,
        activeColor,
        triggerMode,
        active,
        canvasState,
        hitAreaPadding,
        transitionDuration,
        transitionEase,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = useState(false)

    const isActive = (() => {
        if (triggerMode === "controlled") return active
        if (isStatic) return canvasState === "active"
        return hovered
    })()

    const restConfig: StateConfig = {
        lengthPreset: restLengthPreset,
        lengthCustom: restLengthCustom,
        opacity: restOpacity,
        color: resolveColor(restColor, "#1A1A1A"),
    }

    const activeConfig: StateConfig = {
        lengthPreset: activeLengthPreset,
        lengthCustom: activeLengthCustom,
        opacity: activeOpacity,
        color: resolveColor(activeColor, "#1A1A1A"),
    }

    const current = isActive ? activeConfig : restConfig
    const scaleX = lengthPresetToScale(current.lengthPreset, current.lengthCustom)
    const ease = EASE_MAP[transitionEase] ?? EASE_MAP.smooth
    const weight = Math.max(1, strokeWeight)
    const slop = triggerMode === "hover" ? Math.max(0, hitAreaPadding) : 0
    const hitHeight = weight + slop * 2

    const pointerHandlers =
        triggerMode === "hover" && !isStatic
            ? {
                  onPointerEnter: () => setHovered(true),
                  onPointerLeave: () => setHovered(false),
              }
            : {}

    return (
        <div
            {...pointerHandlers}
            style={{
                ...style,
                width: "100%",
                height: hitHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: pinToFlexAlign(pin),
                boxSizing: "border-box",
                overflow: "visible",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: weight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: pinToFlexAlign(pin),
                    pointerEvents: "none",
                }}
            >
                <motion.div
                    animate={{
                        scaleX,
                        opacity: current.opacity,
                        backgroundColor: current.color,
                    }}
                    initial={false}
                    transition={{
                        duration: Math.max(0.05, transitionDuration),
                        ease,
                    }}
                    style={{
                        width: "100%",
                        height: weight,
                        transformOrigin: pinToTransformOrigin(pin),
                        willChange: "transform, opacity",
                        pointerEvents: "none",
                    }}
                />
            </div>
        </div>
    )
}

SefesMagicSnake.defaultProps = {
    pin: "left",
    strokeWeight: 2,

    restLengthPreset: "0",
    restLengthCustom: 0,
    restOpacity: 0,
    restColor: "#1A1A1A",

    activeLengthPreset: "100",
    activeLengthCustom: 100,
    activeOpacity: 1,
    activeColor: "#1A1A1A",

    triggerMode: "controlled",
    active: false,
    canvasState: "rest",
    hitAreaPadding: 8,

    transitionDuration: 0.35,
    transitionEase: "smooth",
}

addPropertyControls(SefesMagicSnake, {
    pin: {
        type: ControlType.Enum,
        title: "Pin",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        description:
            "Left — grows to the right. Right — grows to the left. Center — grows both ways.",
    },

    strokeWeight: {
        type: ControlType.Number,
        title: "Stroke",
        defaultValue: 2,
        min: 1,
        max: 12,
        step: 0.5,
        unit: "px",
        displayStepper: true,
        description: "Line thickness. Stays constant while length animates.",
    },

    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["controlled", "hover"],
        optionTitles: ["Controlled", "Hover"],
        defaultValue: "controlled",
        displaySegmentedControl: true,
        description:
            "Controlled — parent/variant sets Active (nav links). Hover — self-contained pointer on full-width hit area.",
    },

    active: {
        type: ControlType.Boolean,
        title: "Active",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => p.triggerMode !== "controlled",
        description:
            "Drives Rest vs Active state. Override per variant on nav link (Default: Off, Hover: On).",
    },

    canvasState: {
        type: ControlType.Enum,
        title: "Canvas",
        options: ["rest", "active"],
        optionTitles: ["Rest", "Active"],
        defaultValue: "rest",
        displaySegmentedControl: true,
        hidden: (p) => p.triggerMode !== "hover",
        description: "Canvas preview only when Trigger is Hover. Published site uses pointer hover.",
    },

    hitAreaPadding: {
        type: ControlType.Number,
        title: "Hit Slop",
        defaultValue: 8,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p) => p.triggerMode !== "hover",
        description:
            "Invisible padding above/below the stroke. Full width always captures pointer events.",
    },

    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.35,
        min: 0.05,
        max: 2,
        step: 0.05,
        unit: "s",
        displayStepper: true,
    },

    transitionEase: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeInOut", "easeIn", "easeOut", "linear", "smooth", "snappy"],
        optionTitles: ["Ease In Out", "Ease In", "Ease Out", "Linear", "Smooth", "Snappy"],
        defaultValue: "smooth",
    },

    restLengthPreset: {
        type: ControlType.Enum,
        title: "Rest Length",
        options: [...LENGTH_PRESET_OPTIONS],
        optionTitles: [...LENGTH_PRESET_LABELS],
        defaultValue: "0",
    },

    restLengthCustom: {
        type: ControlType.Number,
        title: "Rest Custom %",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => p.restLengthPreset !== "custom",
    },

    restOpacity: {
        type: ControlType.Number,
        title: "Rest Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },

    restColor: {
        type: ControlType.Color,
        title: "Rest Color",
        defaultValue: "#1A1A1A",
    },

    activeLengthPreset: {
        type: ControlType.Enum,
        title: "Active Length",
        options: [...LENGTH_PRESET_OPTIONS],
        optionTitles: [...LENGTH_PRESET_LABELS],
        defaultValue: "100",
    },

    activeLengthCustom: {
        type: ControlType.Number,
        title: "Active Custom %",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => p.activeLengthPreset !== "custom",
    },

    activeOpacity: {
        type: ControlType.Number,
        title: "Active Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },

    activeColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#1A1A1A",
    },
})
