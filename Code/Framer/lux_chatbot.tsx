import { useState, useEffect, useRef } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// "thinking" is set by the widget while waiting, never taken from the backend.
const BACKEND_EXPRESSIONS = ["neutral", "happy", "caring", "calm"]
const THINKING_MIN_MS = 1500
const THINKING_MAX_MS = 4000
const PREFS_KEY = "lux:prefs"
const FONTS_URL =
    "https://fonts.googleapis.com/css2?family=Geist:wght@400&family=Geist+Mono:wght@300;400&family=Gloria+Hallelujah&display=swap"
const HAND_FONT = "'Gloria Hallelujah', cursive"
const SANS_FONT = "'Geist', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO_FONT = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

// File names (without .webp) under the Character URL; every frame of an expression shares one pose so swaps only move the eyes or mouth.
const CHARACTER_FRAMES = {
    neutral: { idle: "neutral_idle", blink: "neutral_blink", talk: ["neutral_talk_1", "neutral_talk_2"] },
    happy: { idle: "happy_idle", blink: "happy_blink", talk: ["happy_talk_1", "happy_talk_2"] },
    caring: { idle: "caring_idle", blink: "caring_blink", talk: ["caring_talk_1", "caring_talk_2"] },
    calm: { idle: "calm_idle", blink: "calm_blink", talk: ["calm_talk_1", "calm_talk_2"] },
    thinking: { idle: "thinking_idle", blink: "thinking_blink", talk: [] },
}
const CHARACTER_FILES = Object.values(CHARACTER_FRAMES).flatMap((f) => [
    f.idle,
    f.blink,
    ...f.talk,
])
const CHARACTER_ASPECT = 400 / 560
const EXPRESSION_FADE_MS = 240
const FRAME_FADE_MS = 50
const TALK_FRAME_MS = 120
const BLINK_MS = 130

// Happy and caring are emotional opposites, so Lux passes through neutral instead of snapping between them.
function needsBridge(from, to) {
    return (
        (from === "happy" && to === "caring") ||
        (from === "caring" && to === "happy")
    )
}

function LuxStage({ expression, talking, baseUrl, height, animate }) {
    const [shown, setShown] = useState(expression)
    const [pose, setPose] = useState("idle")
    const [fading, setFading] = useState(false)
    const shownRef = useRef(expression)

    useEffect(() => {
        if (expression === shownRef.current) return
        const timers = []
        const switchTo = (next) => {
            shownRef.current = next
            setShown(next)
            setPose("idle")
            setFading(true)
            timers.push(setTimeout(() => setFading(false), EXPRESSION_FADE_MS))
        }
        if (animate && needsBridge(shownRef.current, expression)) {
            switchTo("neutral")
            timers.push(setTimeout(() => switchTo(expression), 320))
        } else {
            switchTo(expression)
        }
        return () => timers.forEach(clearTimeout)
    }, [expression, animate])

    const frames = CHARACTER_FRAMES[shown] || CHARACTER_FRAMES.neutral
    const canTalk = animate && talking && frames.talk.length > 0

    useEffect(() => {
        if (!canTalk) {
            setPose("idle")
            return
        }
        const mouths = ["idle", ...frames.talk.map((_, i) => `talk${i}`)]
        let last = "idle"
        const interval = setInterval(() => {
            const options = mouths.filter((m) => m !== last)
            last = options[Math.floor(Math.random() * options.length)]
            setPose(last)
        }, TALK_FRAME_MS)
        return () => clearInterval(interval)
    }, [canTalk, shown])

    useEffect(() => {
        if (!animate || canTalk) return
        let timer
        const scheduleBlink = () => {
            timer = setTimeout(() => {
                setPose("blink")
                timer = setTimeout(() => {
                    setPose("idle")
                    scheduleBlink()
                }, BLINK_MS)
            }, 2500 + Math.random() * 3500)
        }
        scheduleBlink()
        return () => clearTimeout(timer)
    }, [animate, canTalk, shown])

    const active =
        pose === "blink"
            ? frames.blink
            : pose.startsWith("talk")
              ? frames.talk[Number(pose.slice(4))]
              : frames.idle
    const fadeMs = fading ? EXPRESSION_FADE_MS : FRAME_FADE_MS

    // The outgoing frame stays opaque underneath until the incoming one has faded in, so Lux never turns see-through mid-swap.
    const lastActiveRef = useRef(active)
    const outgoingRef = useRef(null)
    if (active !== lastActiveRef.current) {
        outgoingRef.current = lastActiveRef.current
        lastActiveRef.current = active
    }
    const layerStyle = (name) => {
        if (name === active)
            return {
                opacity: 1,
                zIndex: 2,
                transition: animate ? `opacity ${fadeMs}ms ease` : "none",
            }
        if (name === outgoingRef.current)
            return {
                opacity: 0,
                zIndex: 1,
                transition: animate
                    ? `opacity ${fadeMs}ms ease ${fadeMs}ms`
                    : "none",
            }
        return { opacity: 0, zIndex: 0, transition: "none" }
    }

    return (
        <div
            className={animate ? "lux-breathe" : undefined}
            style={{
                position: "relative",
                width: Math.round(height * CHARACTER_ASPECT),
                height,
                transformOrigin: "50% 100%",
            }}
        >
            {CHARACTER_FILES.map((name) => (
                <img
                    key={name}
                    src={`${baseUrl}${name}.webp`}
                    alt=""
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        ...layerStyle(name),
                    }}
                />
            ))}
        </div>
    )
}

function normalizeExpression(value) {
    const v = typeof value === "string" ? value.trim().toLowerCase() : ""
    return BACKEND_EXPRESSIONS.includes(v) ? v : "neutral"
}
function renderMarkdown(text) {
    if (!text) return null
    const lines = text.split("\n").filter((l) => l.trim() !== "")
    const elements = []
    let listBuffer = []

    function flushList(key) {
        if (listBuffer.length > 0) {
            elements.push(
                <ul
                    key={`ul-${key}`}
                    style={{ margin: "8px 0", paddingLeft: 20 }}
                >
                    {listBuffer.map((item, i) => (
                        <li
                            key={i}
                            style={{ marginBottom: 6, lineHeight: "inherit" }}
                        >
                            {renderInline(item)}
                        </li>
                    ))}
                </ul>
            )
            listBuffer = []
        }
    }

    function renderInline(str) {
        const parts = str.split(/(\*\*.*?\*\*|https?:\/\/[^\s)]+)/g)
        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i}>{part.slice(2, -2)}</strong>
            }
            if (/^https?:\/\//.test(part)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: "#E85D00",
                            textDecoration: "underline",
                        }}
                    >
                        {part}
                    </a>
                )
            }
            return <span key={i}>{part}</span>
        })
    }

    lines.forEach((line, idx) => {
        const trimmed = line.trim()
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            listBuffer.push(trimmed.slice(2))
        } else {
            flushList(idx)
            elements.push(
                <p key={idx} style={{ margin: "0 0 10px 0", lineHeight: "inherit" }}>
                    {renderInline(trimmed)}
                </p>
            )
        }
    })
    flushList("end")
    return elements
}

export default function AskLux(props) {
    const {
        assistantName,
        aboutMe,
        accentColor,
        backendUrl,
        questions,
        panelWidth,
        panelHeight,
        borderRadius,
        position,
        offset,
        glassOpacity,
        glassBlur,
        glassSpread,
        characterControls,
        voiceControls,
        characterEnabled,
        characterUrl,
        characterSize,
        animationDuration,
        shadowIntensity,
        iconColor,
        pillBackground,
        pillTextColor,
        suggestionHoverColor,
        dotColor,
        triggerText,
    } = props

    const isStatic = useIsStaticRenderer()

    const [isOpen, setIsOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [visibleQuestions, setVisibleQuestions] = useState(() =>
        shuffle(questions).slice(0, 3)
    )
    const [askedQuestions, setAskedQuestions] = useState([])
    const [questionCount, setQuestionCount] = useState(0)
    const MAX_QUESTIONS_PER_SESSION = 10
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [typedLength, setTypedLength] = useState(0)
    const [isTypingReply, setIsTypingReply] = useState(false)
    const [showInfoCard, setShowInfoCard] = useState(false)
    const [backendLimited, setBackendLimited] = useState(false)
    const [displayExpression, setDisplayExpression] = useState("neutral")
    const thinkingStartedAtRef = useRef(0)
    const pendingExpressionRef = useRef(null)
    const expressionTimersRef = useRef([])
    const [showCharacter, setShowCharacter] = useState(true)
    const [voiceOn, setVoiceOn] = useState(false)
    const [reducedMotion, setReducedMotion] = useState(false)
    const prefsLoadedRef = useRef(false)
    const dragStartRef = useRef({
        mouseX: 0,
        mouseY: 0,
        offsetX: 0,
        offsetY: 0,
    })

    useEffect(() => {
        function check() {
            setIsMobile(window.innerWidth < 768)
        }
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(query.matches)
        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])

    useEffect(() => {
        try {
            const saved = JSON.parse(
                window.localStorage.getItem(PREFS_KEY) || "{}"
            )
            if (typeof saved.showCharacter === "boolean")
                setShowCharacter(saved.showCharacter)
            if (typeof saved.voiceOn === "boolean") setVoiceOn(saved.voiceOn)
        } catch {}
    }, [])

    useEffect(() => {
        if (!prefsLoadedRef.current) {
            prefsLoadedRef.current = true
            return
        }
        try {
            window.localStorage.setItem(
                PREFS_KEY,
                JSON.stringify({ showCharacter, voiceOn })
            )
        } catch {}
    }, [showCharacter, voiceOn])

    useEffect(() => {
        if (!showInfoCard) return
        function handleOutsideClick() {
            setShowInfoCard(false)
        }
        window.addEventListener("click", handleOutsideClick)
        return () => window.removeEventListener("click", handleOutsideClick)
    }, [showInfoCard])

    useEffect(() => {
        const last = messages[messages.length - 1]
        if (!last || last.role !== "bot") return

        const fullText = last.text

        if (isStatic) {
            setTypedLength(fullText.length)
            setIsTypingReply(false)
            return
        }

        setTypedLength(0)
        setIsTypingReply(true)

        let i = 0
        const speed = 15
        const interval = setInterval(() => {
            i++
            setTypedLength(i)
            if (i >= fullText.length) {
                clearInterval(interval)
                setIsTypingReply(false)
            }
        }, speed)

        return () => clearInterval(interval)
    }, [messages.length, isStatic])

    useEffect(() => clearExpressionTimers, [])

    useEffect(() => {
        if (isTypingReply || !pendingExpressionRef.current) return
        const target = pendingExpressionRef.current
        const elapsed = Date.now() - thinkingStartedAtRef.current
        expressionTimersRef.current.push(
            setTimeout(
                () => showExpression(target, "typing finished"),
                Math.max(0, THINKING_MIN_MS - elapsed)
            )
        )
    }, [isTypingReply])

    function clearExpressionTimers() {
        expressionTimersRef.current.forEach(clearTimeout)
        expressionTimersRef.current = []
    }

    function showExpression(expression, reason) {
        clearExpressionTimers()
        pendingExpressionRef.current = null
        setDisplayExpression(expression)
        console.info(`[lux] display: ${expression} (${reason})`)
    }

    function startThinking() {
        clearExpressionTimers()
        pendingExpressionRef.current = null
        thinkingStartedAtRef.current = Date.now()
        setDisplayExpression("thinking")
        console.info("[lux] display: thinking (message sent)")
    }

    // Caring replies (crisis, heavy topics) skip the thinking hold so Lux never looks distracted next to them.
    function scheduleReplyExpression(expression) {
        if (expression === "caring") {
            showExpression("caring", "caring reply, no thinking hold")
            return
        }
        pendingExpressionRef.current = expression
        const elapsed = Date.now() - thinkingStartedAtRef.current
        expressionTimersRef.current.push(
            setTimeout(
                () => showExpression(expression, "thinking cap reached"),
                Math.max(0, THINKING_MAX_MS - elapsed)
            )
        )
    }

    function openPanel() {
        setIsOpen(true)
        if (isStatic) {
            setIsVisible(true)
            return
        }
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setIsVisible(true))
        )
    }
    function closePanel() {
        setIsVisible(false)
        setTimeout(() => {
            setIsOpen(false)
            setDragOffset({ x: 0, y: 0 })
        }, animationDuration)
    }

    function pickColdStartQuestions() {
        return shuffle(questions).slice(0, 3)
    }

    async function send(q) {
        if (
            !q.trim() ||
            questionCount >= MAX_QUESTIONS_PER_SESSION ||
            backendLimited
        )
            return

        const updatedMessages = [...messages, { role: "user", text: q }]
        setMessages(updatedMessages)
        setInput("")
        setLoading(true)
        startThinking()
        setQuestionCount((c) => c + 1)
        // Clear chips while waiting; replace with API followUps after the answer.
        setVisibleQuestions([])
        try {
            const res = await fetch(backendUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: q,
                    name: assistantName,
                    history: updatedMessages.map((m) => ({
                        role: m.role === "user" ? "user" : "assistant",
                        content: m.text,
                    })),
                }),
            })
            const data = await res.json()
            let reply = typeof data.reply === "string" ? data.reply : ""
            const safetyLeak =
                /user\s*safety\s*:|response\s*safety\s*:/i.test(reply) &&
                reply
                    .replace(/user\s*safety\s*:\s*\w+/gi, "")
                    .replace(/response\s*safety\s*:\s*\w+/gi, "")
                    .trim().length < 40
            if (safetyLeak) {
                reply =
                    "I hit a glitch answering that one. Try rephrasing, or call our admissions team at 1-800-618-8719 (Monday-Friday, 8am-5pm) and they'll help directly."
            } else {
                reply = reply
                    .replace(/^\s*user\s*safety\s*:\s*\w+\s*/gim, "")
                    .replace(/^\s*response\s*safety\s*:\s*\w+\s*/gim, "")
                    .trim()
            }
            const expression = safetyLeak
                ? "neutral"
                : normalizeExpression(data.expression)
            console.info(
                `[lux] expression: ${expression}` +
                    (data.expression !== expression
                        ? ` (backend sent ${JSON.stringify(data.expression)})`
                        : "")
            )
            setMessages((m) => [...m, { role: "bot", text: reply, expression }])
            scheduleReplyExpression(expression)
            const followUps = Array.isArray(data.followUps)
                ? data.followUps
                      .filter((item) => typeof item === "string")
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .slice(0, 3)
                : []
            setVisibleQuestions(followUps)
            if (data.limited) setBackendLimited(true)
        } catch {
            setMessages((m) => [
                ...m,
                {
                    role: "bot",
                    text: "Something went wrong on my end. Give it another try in a moment!",
                    expression: "neutral",
                },
            ])
            console.info("[lux] expression: neutral (request failed)")
            scheduleReplyExpression("neutral")
            setVisibleQuestions([])
        }
        setLoading(false)
    }

    function reset() {
        clearExpressionTimers()
        pendingExpressionRef.current = null
        setDisplayExpression("neutral")
        setMessages([])
        setInput("")
        setAskedQuestions([])
        setVisibleQuestions(pickColdStartQuestions())
    }

    function handleDragStart(e) {
        if (isStatic) return
        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        const clientY = e.touches ? e.touches[0].clientY : e.clientY
        dragStartRef.current = {
            mouseX: clientX,
            mouseY: clientY,
            offsetX: dragOffset.x,
            offsetY: dragOffset.y,
        }
        setIsDragging(true)
    }

    useEffect(() => {
        if (!isDragging || isStatic) return

        function handleMove(e) {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX
            const clientY = e.touches ? e.touches[0].clientY : e.clientY
            const dx = clientX - dragStartRef.current.mouseX
            const dy = clientY - dragStartRef.current.mouseY
            setDragOffset({
                x: dragStartRef.current.offsetX + dx,
                y: dragStartRef.current.offsetY + dy,
            })
        }
        function handleUp() {
            setIsDragging(false)
        }

        window.addEventListener("mousemove", handleMove)
        window.addEventListener("mouseup", handleUp)
        window.addEventListener("touchmove", handleMove)
        window.addEventListener("touchend", handleUp)
        return () => {
            window.removeEventListener("mousemove", handleMove)
            window.removeEventListener("mouseup", handleUp)
            window.removeEventListener("touchmove", handleMove)
            window.removeEventListener("touchend", handleUp)
        }
    }, [isDragging, isStatic])

    const lastAnswerPair = []
    for (let i = 0; i < messages.length; i += 2)
        lastAnswerPair.push({ q: messages[i], a: messages[i + 1] })

    const posStyles = {}
    if (!isMobile) {
        if (position === "bottom-right") {
            posStyles.bottom = offset
            posStyles.right = offset
        } else if (position === "bottom-left") {
            posStyles.bottom = offset
            posStyles.left = offset
        } else if (position === "top-right") {
            posStyles.top = offset
            posStyles.right = offset
        } else if (position === "top-left") {
            posStyles.top = offset
            posStyles.left = offset
        } else if (position === "center") {
            posStyles.top = "50%"
            posStyles.left = "50%"
            posStyles.transform = isVisible
                ? "translate(-50%, -50%) scale(1)"
                : "translate(-50%, -50%) scale(0.97)"
        }
    } else {
        posStyles.bottom = 0
        posStyles.left = 0
    }

    const transformOrigin = position === "center" ? "center" : position
    const spread = glassSpread || 0
    const featherMask = `linear-gradient(to right, transparent, #000 ${spread}px, #000 calc(100% - ${spread}px), transparent), linear-gradient(to bottom, transparent, #000 ${spread}px, #000 calc(100% - ${spread}px), transparent)`
    const headerIconButton = {
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        color: "#555",
    }

    return (
        <div
            style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                position: "relative",
                display: "inline-block",
            }}
        >
            <style>{`
    @import url("${FONTS_URL}");
    .ao-suggestion { transition: ${isStatic ? "none" : "color 150ms ease"}; }
    .ao-suggestion:hover { color: ${suggestionHoverColor} !important; }
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        .lux-glass { background: #fff !important; }
    }
    ${
        !isStatic
            ? `
    @keyframes ao-bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-5px); }
    }
    .ao-dot { animation: ao-bounce 1.2s infinite ease-in-out; }
    .ao-dot:nth-child(2) { animation-delay: 0.15s; }
    .ao-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes lux-breathe {
        0%, 100% { transform: translateY(0) scaleY(1); }
        50% { transform: translateY(-3px) scaleY(1.012); }
    }
    .lux-breathe { animation: lux-breathe 3.6s ease-in-out infinite; }
    `
            : ""
    }
`}</style>

            <div
                onClick={() => (isOpen ? closePanel() : openPanel())}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: triggerText ? 8 : 0,
                    background: pillBackground,
                    color: pillTextColor,
                    padding: triggerText ? "9px 18px 9px 14px" : 0,
                    width: triggerText ? "auto" : 44,
                    height: triggerText ? "auto" : 44,
                    borderRadius: 999,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    userSelect: "none",
                }}
            >
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0 }}
                >
                    <path
                        d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z"
                        fill={iconColor}
                    />
                </svg>
                {triggerText && <span>{triggerText}</span>}
            </div>

            {isOpen && (
                <div
                    style={{
                        position: "fixed",
                        ...posStyles,
                        width: isMobile ? "100%" : panelWidth,
                        height: isMobile ? "85vh" : panelHeight,
                        maxWidth: isMobile ? "100%" : "95vw",
                        maxHeight: "95vh",
                        zIndex: 9999,
                        opacity: isVisible ? 1 : 0,
                        transform:
                            position === "center"
                                ? `${posStyles.transform} translate(${dragOffset.x}px, ${dragOffset.y}px)`
                                : isVisible
                                  ? `translate(${dragOffset.x}px, ${dragOffset.y}px)`
                                  : "translateY(16px) scale(0.97)",
                        transition:
                            isDragging || isStatic
                                ? "none"
                                : `transform ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${animationDuration}ms ease`,
                        transformOrigin: transformOrigin,
                    }}
                >
                    {characterEnabled && showCharacter && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                zIndex: 1,
                                pointerEvents: "none",
                                ...(isMobile
                                    ? { bottom: "100%", right: 16 }
                                    : position === "bottom-left" ||
                                        position === "top-left"
                                      ? { bottom: 0, left: "calc(100% + 4px)" }
                                      : { bottom: 0, right: "calc(100% + 4px)" }),
                            }}
                        >
                            <LuxStage
                                expression={displayExpression}
                                talking={isTypingReply}
                                baseUrl={characterUrl}
                                height={
                                    isMobile
                                        ? Math.min(110, characterSize)
                                        : characterSize
                                }
                                animate={!isStatic && !reducedMotion}
                            />
                        </div>
                    )}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: -spread,
                            backdropFilter: `blur(${glassBlur}px) saturate(140%)`,
                            WebkitBackdropFilter: `blur(${glassBlur}px) saturate(140%)`,
                            maskImage: featherMask,
                            WebkitMaskImage: featherMask,
                            maskComposite: "intersect",
                            WebkitMaskComposite: "source-in",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        className="lux-glass"
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            background: `rgba(255,255,255,${glassOpacity})`,
                            borderRadius: isMobile
                                ? `${borderRadius}px ${borderRadius}px 0 0`
                                : borderRadius,
                            boxShadow: `0 20px 60px rgba(0,0,0,${shadowIntensity})`,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderBottom: "1px solid rgba(0,0,0,0.08)",
                                padding: "16px 22px",
                                flexShrink: 0,
                                position: "relative",
                            }}
                        >
                            <span
                                onMouseDown={handleDragStart}
                                onTouchStart={handleDragStart}
                                title="Drag to move"
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate(-50%, -50%)",
                                    cursor: isStatic
                                        ? "default"
                                        : isDragging
                                          ? "grabbing"
                                          : "grab",
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gridTemplateRows: "repeat(2, 1fr)",
                                    gap: 3,
                                    padding: 4,
                                }}
                            >
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: accentColor,
                                        display: "inline-block",
                                    }}
                                />
                                <span
                                    style={{
                                        fontFamily: HAND_FONT,
                                        fontWeight: 400,
                                        fontSize: 15,
                                        letterSpacing: 1,
                                    }}
                                >
                                    {assistantName?.toUpperCase()}
                                </span>
                                <div style={{ position: "relative" }}>
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowInfoCard((v) => !v)
                                        }}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="#999"
                                                strokeWidth="1.6"
                                            />
                                            <line
                                                x1="12"
                                                y1="11"
                                                x2="12"
                                                y2="16.5"
                                                stroke="#999"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                            />
                                            <circle
                                                cx="12"
                                                cy="7.7"
                                                r="1.1"
                                                fill="#999"
                                            />
                                        </svg>
                                    </span>

                                    {showInfoCard && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 22,
                                                left: 0,
                                                width: 300,
                                                maxWidth: "min(300px, 78vw)",
                                                maxHeight: 320,
                                                overflowY: "auto",
                                                background: "#FFFFFF",
                                                borderRadius: 10,
                                                padding: "12px 14px",
                                                fontSize: 11,
                                                lineHeight: 1.45,
                                                color: "#444",
                                                boxShadow:
                                                    "0 6px 20px rgba(0,0,0,0.15)",
                                                zIndex: 10000,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    marginBottom: 8,
                                                    color: "#1a1a1a",
                                                }}
                                            >
                                                Disclaimer
                                            </div>
                                            <p style={{ margin: "0 0 8px 0" }}>
                                                Lux provides general information
                                                only. It cannot and does not
                                                offer medical advice, clinical
                                                diagnoses, or treatment
                                                recommendations of any kind.
                                            </p>
                                            <p style={{ margin: "0 0 8px 0" }}>
                                                The sole purpose is to help
                                                users navigate our website,
                                                understand our specific
                                                treatment programs, and explain
                                                general state regulations that
                                                govern our services. If you have
                                                questions regarding your health,
                                                medical care, or clinical needs,
                                                consult a qualified healthcare
                                                professional immediately.
                                                AI-generated responses may
                                                contain errors or inaccuracies.
                                            </p>
                                            <p style={{ margin: 0 }}>
                                                This is for informational
                                                purposes only. For medical
                                                advice or diagnosis, consult a
                                                professional.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 18,
                                }}
                            >
                                {characterControls && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCharacter((v) => !v)
                                        }
                                        aria-pressed={showCharacter}
                                        aria-label={`${showCharacter ? "Hide" : "Show"} ${assistantName}`}
                                        title={`${showCharacter ? "Hide" : "Show"} ${assistantName}`}
                                        style={headerIconButton}
                                    >
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
                                            {!showCharacter && (
                                                <path d="M4 4l16 16" />
                                            )}
                                        </svg>
                                    </button>
                                )}
                                {voiceControls && (
                                    <button
                                        type="button"
                                        onClick={() => setVoiceOn((v) => !v)}
                                        aria-pressed={voiceOn}
                                        aria-label={
                                            voiceOn ? "Mute voice" : "Turn on voice"
                                        }
                                        title={
                                            voiceOn ? "Mute voice" : "Turn on voice"
                                        }
                                        style={headerIconButton}
                                    >
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M11 5L6 9H3v6h3l5 4z" />
                                            {voiceOn ? (
                                                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                                            ) : (
                                                <path d="M16 9l5 6M21 9l-5 6" />
                                            )}
                                        </svg>
                                    </button>
                                )}
                                {messages.length > 0 && (
                                    <span
                                        onClick={reset}
                                        title="Reset"
                                        style={{
                                            cursor: "pointer",
                                            fontSize: 15,
                                            color: "#555",
                                            lineHeight: 1,
                                        }}
                                    >
                                        ↺
                                    </span>
                                )}
                                <span
                                    onClick={closePanel}
                                    style={{
                                        cursor: "pointer",
                                        fontFamily: MONO_FONT,
                                        fontWeight: 300,
                                        fontSize: 13,
                                        color: "#9a9a9a",
                                    }}
                                >
                                    Close
                                </span>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: isMobile ? "column" : "row",
                                flex: 1,
                                minHeight: 0,
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    minHeight: 0,
                                    minWidth: 0,
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        overflowY: "auto",
                                        padding: isMobile
                                            ? "20px 18px"
                                            : "28px 32px",
                                    }}
                                >
                                    {messages.length === 0 ? (
                                        <>
                                            <div style={{ flex: 1 }} />
                                            <h2
                                                style={{
                                                    fontFamily: HAND_FONT,
                                                    fontWeight: 400,
                                                    fontSize: isMobile
                                                        ? 19
                                                        : 21,
                                                    margin: "0 0 18px 0",
                                                    color: "#1a1a1a",
                                                }}
                                            >
                                                What would you like to know?
                                            </h2>
                                            <div>
                                                {visibleQuestions.map(
                                                    (q, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() =>
                                                                send(q)
                                                            }
                                                            className="ao-suggestion"
                                                            style={{
                                                                cursor: "pointer",
                                                                fontFamily: SANS_FONT,
                                                                color: "#8a8a8a",
                                                                fontSize: 14,
                                                                margin: "8px 0",
                                                                display: "flex",
                                                                gap: 8,
                                                            }}
                                                        >
                                                            <span>↳</span>
                                                            <span>{q}</span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {lastAnswerPair.map((pair, i) => (
                                                <div
                                                    key={i}
                                                    style={{ marginBottom: 24 }}
                                                >
                                                    {pair.q && (
                                                        <div
                                                            style={{
                                                                fontFamily: MONO_FONT,
                                                                color: "#9a9a9a",
                                                                fontSize: 14,
                                                                marginBottom: 12,
                                                                overflowWrap: "anywhere",
                                                            }}
                                                        >
                                                            {pair.q.text}
                                                        </div>
                                                    )}
                                                    {pair.a && (
                                                        <div
                                                            style={{
                                                                fontFamily: MONO_FONT,
                                                                fontWeight: 300,
                                                                color: "#242424",
                                                                fontSize: 15,
                                                                lineHeight: "1.1em",
                                                                overflowWrap: "anywhere",
                                                            }}
                                                        >
                                                            {renderMarkdown(
                                                                i ===
                                                                    lastAnswerPair.length -
                                                                        1 &&
                                                                    isTypingReply
                                                                    ? pair.a.text.slice(
                                                                          0,
                                                                          typedLength
                                                                      )
                                                                    : pair.a
                                                                          .text
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {loading && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 5,
                                                        padding: "4px 0",
                                                    }}
                                                >
                                                    <span
                                                        className="ao-dot"
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background:
                                                                dotColor,
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    />
                                                    <span
                                                        className="ao-dot"
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background:
                                                                dotColor,
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    />
                                                    <span
                                                        className="ao-dot"
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background:
                                                                dotColor,
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {!loading &&
                                                !isTypingReply &&
                                                visibleQuestions.length > 0 && (
                                                <div style={{ marginTop: 18 }}>
                                                    {visibleQuestions.map(
                                                        (q, i) => (
                                                            <div
                                                                key={i}
                                                                onClick={() =>
                                                                    send(q)
                                                                }
                                                                className="ao-suggestion"
                                                                style={{
                                                                    cursor: "pointer",
                                                                    fontFamily: SANS_FONT,
                                                                    color: "#8a8a8a",
                                                                    fontSize: 14,
                                                                    margin: "8px 0",
                                                                    display:
                                                                        "flex",
                                                                    gap: 8,
                                                                }}
                                                            >
                                                                <span>↳</span>
                                                                <span>{q}</span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div
                                    style={{
                                        padding: isMobile
                                            ? "12px 18px 18px"
                                            : "12px 32px 22px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            background: "#f4f4f4",
                                            borderRadius: 999,
                                            padding: "8px 8px 8px 18px",
                                        }}
                                    >
                                        <input
                                            value={input}
                                            onChange={(e) =>
                                                setInput(e.target.value)
                                            }
                                            onKeyDown={(e) =>
                                                e.key === "Enter" && send(input)
                                            }
                                            placeholder={`Ask ${assistantName}...`}
                                            style={{
                                                flex: 1,
                                                border: "none",
                                                background: "transparent",
                                                outline: "none",
                                                fontSize: 14,
                                                fontFamily: SANS_FONT,
                                                color: "#333",
                                            }}
                                        />
                                        <button
                                            onClick={() => send(input)}
                                            style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: "50%",
                                                border: "none",
                                                background: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.15)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#666",
                                            }}
                                        >
                                            ↑
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(AskLux, {
    assistantName: {
        type: ControlType.String,
        title: "Assistant Name",
        defaultValue: "Lux",
    },
    triggerText: {
        type: ControlType.String,
        title: "Trigger Text",
        defaultValue: "Ask Lux",
    },
    aboutMe: {
        type: ControlType.String,
        defaultValue: "Bio goes here...",
        displayTextArea: true,
    },
    accentColor: { type: ControlType.Color, defaultValue: "#E07802" },
    backendUrl: {
        type: ControlType.String,
        title: "Backend URL",
        defaultValue: "https://monarch-d9py.vercel.app/api/chat",
    },
    questions: {
        type: ControlType.Array,
        control: { type: ControlType.String },
        defaultValue: [
            "What projects have you worked on?",
            "How do you approach product strategy?",
            "What are your favorite parts of design?",
            "What was your experience at your last role?",
            "What are you most proud of?",
        ],
    },
    panelWidth: {
        type: ControlType.String,
        title: "Width",
        defaultValue: "min(440px, 92vw)",
    },
    panelHeight: {
        type: ControlType.String,
        title: "Height",
        defaultValue: "min(560px, 80vh)",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 48,
        step: 1,
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: [
            "bottom-right",
            "bottom-left",
            "top-right",
            "top-left",
            "center",
        ],
        optionTitles: [
            "Bottom Right",
            "Bottom Left",
            "Top Right",
            "Top Left",
            "Center",
        ],
        defaultValue: "bottom-right",
    },
    offset: {
        type: ControlType.Number,
        title: "Edge Offset",
        defaultValue: 32,
        min: 0,
        max: 120,
        step: 1,
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Opacity",
        defaultValue: 0.78,
        min: 0.3,
        max: 1,
        step: 0.02,
    },
    glassBlur: {
        type: ControlType.Number,
        title: "Glass Blur",
        defaultValue: 18,
        min: 0,
        max: 40,
        step: 1,
    },
    glassSpread: {
        type: ControlType.Number,
        title: "Blur Spread",
        defaultValue: 24,
        min: 0,
        max: 40,
        step: 1,
    },
    characterEnabled: {
        type: ControlType.Boolean,
        title: "Character",
        defaultValue: true,
    },
    characterUrl: {
        type: ControlType.String,
        title: "Character URL",
        defaultValue: "https://monarch-d9py.vercel.app/lux/",
        hidden: (props) => !props.characterEnabled,
    },
    characterSize: {
        type: ControlType.Number,
        title: "Character Size",
        defaultValue: 220,
        min: 120,
        max: 400,
        step: 10,
        unit: "px",
        hidden: (props) => !props.characterEnabled,
    },
    characterControls: {
        type: ControlType.Boolean,
        title: "Character Toggle",
        defaultValue: false,
    },
    voiceControls: {
        type: ControlType.Boolean,
        title: "Voice Toggle",
        defaultValue: false,
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Strength",
        defaultValue: 0.25,
        min: 0,
        max: 0.6,
        step: 0.05,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation (ms)",
        defaultValue: 280,
        min: 100,
        max: 800,
        step: 10,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#E07802",
    },
    pillBackground: {
        type: ControlType.Color,
        title: "Pill Background",
        defaultValue: "#0d0d0d",
    },
    pillTextColor: {
        type: ControlType.Color,
        title: "Pill Text Color",
        defaultValue: "#ffffff",
    },
    suggestionHoverColor: {
        type: ControlType.Color,
        title: "Suggestion Hover Color",
        defaultValue: "#E85D00",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Loading Dot Color",
        defaultValue: "#E85D00",
    },
})
