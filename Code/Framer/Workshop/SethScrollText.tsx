// SethScrollText — Monarch wrapper around Workshop/ScrollText.tsx.
// Typography controls live on ScrollText (Project Style links Framer text styles via the Font control).

import * as React from "react"
import ScrollText from "./ScrollText"

type ScrollTextProps = React.ComponentProps<typeof ScrollText>

type SethScrollTextProps = ScrollTextProps & {
    enableSmooth?: boolean
    enableBlur?: boolean
}

/**
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 180
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SethScrollText(props: SethScrollTextProps) {
    const { enableSmooth, enableBlur, smooth, blur, ...rest } = props

    return (
        <ScrollText
            {...rest}
            smooth={smooth ?? enableSmooth ?? true}
            blur={blur ?? enableBlur ?? false}
        />
    )
}
