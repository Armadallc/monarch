import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

const appRoot = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(appRoot, "../..")

/** Merge repo-root `.env` with `apps/referral-app/.env.local` (app wins). */
function mergedViteEnv(mode: string) {
    return {
        ...loadEnv(mode, repoRoot, ""),
        ...loadEnv(mode, appRoot, ""),
    }
}

export default defineConfig(({ mode }) => {
    const env = mergedViteEnv(mode)
    const define = Object.fromEntries(
        Object.entries(env)
            .filter(([key]) => key.startsWith("VITE_"))
            .map(([key, val]) => [`import.meta.env.${key}`, JSON.stringify(val)])
    )

    return {
        plugins: [react()],
        server: { port: 5173, open: true },
        define,
    }
})
