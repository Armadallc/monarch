import type { AuthBucket } from "../config/program"

const AUTH_BUCKET_LS_KEY = "monarch_referrals_auth_bucket"
const AUTH_BUCKET_SS_KEY = "monarch_referrals_auth_bucket"

export function writeAuthBucketHint(bucket: AuthBucket): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(AUTH_BUCKET_LS_KEY, bucket)
    } catch {
        /* ignore */
    }
    try {
        sessionStorage.setItem(AUTH_BUCKET_SS_KEY, bucket)
    } catch {
        /* ignore */
    }
}

function readStoredAuthBucket(): AuthBucket | null {
    try {
        const ss = sessionStorage.getItem(AUTH_BUCKET_SS_KEY)
        if (ss === "source" || ss === "staff") return ss
    } catch {
        /* ignore */
    }
    try {
        const ls = localStorage.getItem(AUTH_BUCKET_LS_KEY)
        if (ls === "source" || ls === "staff") return ls
    } catch {
        /* ignore */
    }
    return null
}

export function hasSupabaseAuthCallback(): boolean {
    if (typeof window === "undefined") return false
    const h = window.location.hash
    const sp = new URLSearchParams(window.location.search)
    if (/access_token|refresh_token|provider_token|error=/i.test(h)) return true
    return Boolean(sp.get("code"))
}

function normalizedPathname(): string {
    if (typeof window === "undefined") return "/"
    const p = window.location.pathname.replace(/\/+$/, "")
    return p || "/"
}

function isAdminLoginPath(): boolean {
    return normalizedPathname() === "/admin"
}

/** OAuth may strip `bucket` from the return URL — reuse stored hint on callback. */
export function resolveLoginAuthBucket(): AuthBucket {
    if (typeof window === "undefined") return "source"
    if (isAdminLoginPath()) {
        writeAuthBucketHint("staff")
        return "staff"
    }
    const sp = new URLSearchParams(window.location.search)
    if (sp.get("bucket") === "source") {
        writeAuthBucketHint("source")
        return "source"
    }
    if (sp.get("bucket") === "staff") {
        writeAuthBucketHint("staff")
        return "staff"
    }
    if (normalizedPathname() === "/login") {
        writeAuthBucketHint("source")
        return "source"
    }
    if (hasSupabaseAuthCallback()) {
        const stored = readStoredAuthBucket()
        if (stored) return stored
        return "source"
    }
    const stored = readStoredAuthBucket()
    if (stored) return stored
    return "source"
}

export function clearForceLoginParamsFromUrl(): void {
    if (typeof window === "undefined") return
    try {
        const url = new URL(window.location.href)
        if (!url.searchParams.has("switch") && !url.searchParams.has("force_login")) return
        url.searchParams.delete("switch")
        url.searchParams.delete("force_login")
        const next = `${url.pathname}${url.search}${url.hash}`
        window.history.replaceState({}, "", next)
    } catch {
        /* ignore */
    }
}

export function hasForceLoginParam(): boolean {
    if (typeof window === "undefined") return false
    const q = new URLSearchParams(window.location.search)
    return q.get("switch") === "1" || q.get("force_login") === "1"
}

export function readAuthCallbackError(): string | null {
    if (typeof window === "undefined") return null
    try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
        const q = new URLSearchParams(window.location.search)
        const desc = hash.get("error_description") || q.get("error_description")
        if (desc) return decodeURIComponent(desc.replace(/\+/g, " "))
        const err = hash.get("error") || q.get("error")
        if (err) return decodeURIComponent(err.replace(/\+/g, " "))
    } catch {
        /* ignore */
    }
    return null
}
