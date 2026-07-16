// TipHotspot — moonstone + marker that spins to * on hover; tip bubble on hover.

import * as React from "react"
import { useState } from "react"
import { addPropertyControls, ControlType } from "framer"

interface TipHotspotProps {
    title?: string
    body?: string
    align?: "start" | "center" | "end"
    tipWidth?: number
    markerSize?: number
    markerColor?: string
    markerHoverColor?: string
    tipBackground?: string
    tipTextColor?: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 22
 * @framerIntrinsicHeight 22
 */
export default function TipHotspot(props: TipHotspotProps) {
    const {
        title = "Tip",
        body = "Helpful detail about this part of the portal.",
        align = "start",
        tipWidth = 220,
        markerSize = 22,
        markerColor = "#7EACB5",
        markerHoverColor = "#5F8F98",
        tipBackground = "#050708",
        tipTextColor = "#FAFAFA",
        style,
    } = props

    const [open, setOpen] = useState(false)
    const glyphSize = Math.max(12, Math.round(markerSize * 0.72))

    return (
        <div
            style={{
                position: "relative",
                display: "inline-flex",
                flexDirection: "column",
                alignItems:
                    align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start",
                width: "fit-content",
                height: "fit-content",
                zIndex: open ? 40 : 5,
                ...style,
            }}
            onPointerEnter={() => setOpen(true)}
            onPointerLeave={() => setOpen(false)}
        >
            <button
                type="button"
                aria-label={title}
                aria-expanded={open}
                style={{
                    position: "relative",
                    width: markerSize,
                    height: markerSize,
                    borderRadius: 999,
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    background: "transparent",
                    boxShadow: open
                        ? `0 0 0 2px ${markerHoverColor}55`
                        : "0 0 0 0 transparent",
                    transition: "box-shadow 280ms ease, transform 280ms ease",
                    transform: open ? "scale(1.08)" : "scale(1)",
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: open ? markerHoverColor : markerColor,
                }}
            >
                <span
                    aria-hidden
                    style={{
                        position: "relative",
                        width: glyphSize,
                        height: glyphSize,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: open ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 320ms cubic-bezier(0.33, 1, 0.68, 1)",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: '"Space Grotesk", "Montserrat", system-ui, sans-serif',
                            fontSize: glyphSize,
                            fontWeight: 600,
                            lineHeight: 1,
                            opacity: open ? 0 : 1,
                            transform: open ? "scale(0.7)" : "scale(1)",
                            transition: "opacity 220ms ease, transform 320ms cubic-bezier(0.33, 1, 0.68, 1)",
                            pointerEvents: "none",
                        }}
                    >
                        +
                    </span>
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: '"Space Grotesk", "Montserrat", system-ui, sans-serif',
                            fontSize: glyphSize + 1,
                            fontWeight: 600,
                            lineHeight: 1,
                            opacity: open ? 1 : 0,
                            transform: open ? "scale(1)" : "scale(0.7)",
                            transition: "opacity 220ms ease, transform 320ms cubic-bezier(0.33, 1, 0.68, 1)",
                            pointerEvents: "none",
                        }}
                    >
                        *
                    </span>
                </span>
            </button>

            <div
                role="tooltip"
                style={{
                    position: "absolute",
                    top: markerSize + 8,
                    left: align === "end" ? "auto" : 0,
                    right: align === "end" ? 0 : "auto",
                    width: tipWidth,
                    maxWidth: "min(260px, 70vw)",
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: tipBackground,
                    color: tipTextColor,
                    boxSizing: "border-box",
                    opacity: open ? 1 : 0,
                    visibility: open ? "visible" : "hidden",
                    pointerEvents: open ? "auto" : "none",
                    transform: open ? "translateY(0)" : "translateY(-4px)",
                    transition: "opacity 160ms ease, transform 160ms ease, visibility 160ms ease",
                    boxShadow: "0 10px 28px rgba(5, 7, 8, 0.28)",
                    textAlign: "left",
                }}
            >
                <div
                    style={{
                        fontFamily: '"Space Grotesk", "Montserrat", system-ui, sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        marginBottom: 6,
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 12,
                        fontWeight: 400,
                        lineHeight: 1.45,
                        opacity: 0.92,
                    }}
                >
                    {body}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(TipHotspot, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Tip",
    },
    body: {
        type: ControlType.String,
        title: "Body",
        displayTextArea: true,
        defaultValue: "Helpful detail about this part of the portal.",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["start", "center", "end"],
        optionTitles: ["Start", "Center", "End"],
        defaultValue: "start" as const,
        displaySegmentedControl: true,
    },
    tipWidth: {
        type: ControlType.Number,
        title: "Tip Width",
        defaultValue: 220,
        min: 160,
        max: 320,
        step: 4,
        unit: "px",
    },
    markerSize: {
        type: ControlType.Number,
        title: "Marker",
        defaultValue: 22,
        min: 14,
        max: 32,
        step: 1,
        unit: "px",
    },
    markerColor: {
        type: ControlType.Color,
        title: "Marker",
        defaultValue: "#7EACB5",
    },
    markerHoverColor: {
        type: ControlType.Color,
        title: "Hover",
        defaultValue: "#5F8F98",
    },
    tipBackground: {
        type: ControlType.Color,
        title: "Tip BG",
        defaultValue: "#050708",
    },
    tipTextColor: {
        type: ControlType.Color,
        title: "Tip Text",
        defaultValue: "#FAFAFA",
    },
})
