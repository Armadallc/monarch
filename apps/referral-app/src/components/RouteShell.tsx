import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { supabaseEnvConfigured } from "../env"

type Props = {
    route: string
    title: string
    description: string
    source: string
    children?: ReactNode
}

export function RouteShell({ route, title, description, source, children }: Props) {
    const envOk = supabaseEnvConfigured()

    return (
        <div className="shell">
            <span className="badge">Staging shell</span>
            <div className="card">
                <h1>{title}</h1>
                <p>
                    <strong>Route:</strong> <code>{route}</code>
                </p>
                <p>{description}</p>
                <p>
                    <strong>Port from:</strong> <code>{source}</code>
                </p>
                <p>
                    Supabase env:{" "}
                    <span className={envOk ? "env-ok" : "env-missing"}>
                        {envOk ? "configured" : "missing — set VITE_SUPABASE_* in Vercel"}
                    </span>
                </p>
                {children}
                <p style={{ marginTop: "1.25rem" }}>
                    <Link to="/">← All routes</Link>
                    {" · "}
                    <a href="https://www.monarchcompetency.com">Marketing site</a>
                </p>
            </div>
        </div>
    )
}
