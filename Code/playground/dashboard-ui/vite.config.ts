import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@design": path.resolve(dir, "src/theme/playgroundDesign.ts"),
        },
    },
    server: {
        port: 5173,
        open: true,
    },
})
