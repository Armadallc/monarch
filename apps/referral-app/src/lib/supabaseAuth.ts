import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { AuthBucket } from "../config/program"
import { supabaseEnvConfigured } from "../env"

/** Anonymous client for token-based flows (ROI share links) — no auth session. */
export function createAnonSupabaseClient(): SupabaseClient | null {
    if (!supabaseEnvConfigured()) return null
    return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
}

function supabaseProjectRef(): string {
    const url = import.meta.env.VITE_SUPABASE_URL ?? ""
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
    return match?.[1] ?? ""
}

function authStorageKey(bucket: AuthBucket): string {
    const ref = supabaseProjectRef()
    return `sb-${ref}-auth-${bucket}`
}

export function createAuthGatewaySupabase(bucket: AuthBucket): SupabaseClient | null {
    if (!supabaseEnvConfigured()) return null
    return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
        auth: {
            storageKey: authStorageKey(bucket),
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })
}

export async function promoteStaffSessionToStaffBucket(sourceClient: SupabaseClient): Promise<boolean> {
    const {
        data: { session },
    } = await sourceClient.auth.getSession()
    if (!session?.access_token || !session.refresh_token) return false
    const staffClient = createAuthGatewaySupabase("staff")
    if (!staffClient) return false
    const { error } = await staffClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
    })
    if (error) return false
    await sourceClient.auth.signOut({ scope: "local" })
    return true
}
