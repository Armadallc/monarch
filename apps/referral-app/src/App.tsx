import { Link, Route, Routes, useSearchParams } from "react-router-dom"
import AuthGateway from "./components/AuthGateway"
import DocumentUploadFormPage from "./pages/DocumentUploadFormPage"
import ReferralFormPage from "./pages/ReferralFormPage"
import ReferralDashboardPage from "./pages/ReferralDashboardPage"
import ReferralSourcePortalPage from "./pages/ReferralSourcePortalPage"
import { RouteShell } from "./components/RouteShell"

function HomePage() {
    const routes = [
        ["/login", "Referral partner sign-in"],
        ["/admin", "Staff sign-in"],
        ["/portal", "Referral source portal"],
        ["/dashboard", "Admissions dashboard"],
        ["/submit-referrals", "Secure referral form"],
        ["/submit-referrals/documents", "Document upload"],
        ["/r", "ROI share link (?token=)"],
    ] as const

    return (
        <div className="shell">
            <span className="badge">Monarch referral app</span>
            <div className="card">
                <h1>Staging — route shell</h1>
                <p>
                    Vercel deploy target for PHI workflows. Components from{" "}
                    <code>Code/Framer/*.tsx</code> port here next.
                </p>
                <ul className="nav-list">
                    {routes.map(([path, label]) => (
                        <li key={path}>
                            <Link to={path}>
                                {path}
                            </Link>
                            {" — "}
                            {label}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

function RoiPage() {
    const [params] = useSearchParams()
    const token = params.get("token")

    return (
        <RouteShell
            route="/r?token=…"
            title="ROI share page"
            description="DocuSeal embed + token validation. Query token required in production."
            source="Code/Framer/ReferralSharePage.tsx"
        >
            <p>
                <strong>Token:</strong> {token ? `${token.slice(0, 8)}…` : "(none — add ?token= for smoke test)"}
            </p>
        </RouteShell>
    )
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthGateway />} />
            <Route path="/admin" element={<AuthGateway />} />
            <Route path="/portal" element={<ReferralSourcePortalPage />} />
            <Route path="/dashboard" element={<ReferralDashboardPage />} />
            <Route path="/submit-referrals" element={<ReferralFormPage />} />
            <Route path="/submit-referrals/documents" element={<DocumentUploadFormPage />} />
            <Route path="/r" element={<RoiPage />} />
            <Route
                path="*"
                element={
                    <RouteShell
                        route="(unknown)"
                        title="Not found"
                        description="Unknown route — SPA fallback is working if you see this via a direct URL."
                        source="—"
                    />
                }
            />
        </Routes>
    )
}
