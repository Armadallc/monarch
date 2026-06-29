import type { CSSProperties, ElementType, ReactNode } from "react"
import { COLORS, FONT_HEADING } from "@design"

/** Card/list names — info blue; panel/modal use foreground via size. */
const NAME_COLOR_DEFAULT = COLORS.infoText

export type ClientNameSize = "sm" | "md" | "panel" | "chat" | "modal"

const SIZE_STYLES: Record<ClientNameSize, CSSProperties> = {
    sm: { fontSize: 13, fontWeight: 600 },
    md: { fontSize: 14, fontWeight: 600 },
    panel: { fontSize: 16, fontWeight: 600 },
    chat: { fontSize: 17, fontWeight: 600 },
    modal: { fontSize: 22, fontWeight: 600 },
}

export function clientNameStyle(size: ClientNameSize = "md", extra?: CSSProperties): CSSProperties {
    const useForeground = size === "panel" || size === "chat" || size === "modal"
    return {
        ...SIZE_STYLES[size],
        color: useForeground ? COLORS.ash : NAME_COLOR_DEFAULT,
        fontFamily: FONT_HEADING,
        letterSpacing: "-0.02em",
        ...extra,
    }
}

type Props = {
    as?: ElementType
    size?: ClientNameSize
    children: ReactNode
    style?: CSSProperties
    title?: string
    id?: string
}

export function ClientName({ as: Tag = "span", size = "md", children, style, title, id }: Props) {
    return (
        <Tag id={id} style={clientNameStyle(size, style)} title={title}>
            {children}
        </Tag>
    )
}
