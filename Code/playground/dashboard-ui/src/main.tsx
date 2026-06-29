import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "../../../theme/dashboard-theme.css"
import { initMonarchThemeMode } from "../../../theme"

initMonarchThemeMode()

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
)
