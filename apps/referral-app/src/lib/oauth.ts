import type { SupabaseClient } from "@supabase/supabase-js"
import { loginUrlForBucket } from "../config/program"
import type { AuthBucket } from "../config/program"

export async function startProviderOAuth(
    supabase: SupabaseClient,
    provider: "google" | "apple",
    bucket: AuthBucket,
    forceAccountPicker = false
): Promise<{ error: Error | null }> {
    const redirectTo = loginUrlForBucket(bucket)
    const oauthOptions: {
        redirectTo: string
        skipBrowserRedirect: true
        queryParams?: Record<string, string>
    } = { redirectTo, skipBrowserRedirect: true }
    if (provider === "google" && forceAccountPicker) {
        oauthOptions.queryParams = { prompt: "select_account" }
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
    })
    if (error) return { error }
    const url = data?.url
    if (!url) {
        return {
            error: new Error("Could not start sign-in. Use email magic link or try again."),
        }
    }
    window.location.href = url
    return { error: null }
}
