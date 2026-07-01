import { supabaseEnvConfigured } from "../env"
import DocumentUploadForm from "../components/DocumentUploadForm"

export default function DocumentUploadFormPage() {
    if (!supabaseEnvConfigured()) {
        return (
            <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "Montserrat, sans-serif" }}>
                <p style={{ margin: 0 }}>
                    Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and{" "}
                    <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code> (local) or Vercel env vars, then
                    redeploy.
                </p>
            </div>
        )
    }
    return <DocumentUploadForm />
}
