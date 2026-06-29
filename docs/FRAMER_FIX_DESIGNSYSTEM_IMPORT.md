# Fix publish errors on /submit-referrals, /dashboard, and /portal

**Cause:** These pages use code components that import `from "../DesignSystem"`. Framer does not resolve that path when building, so publish fails.

**Fix:** In Framer, open each code component and **replace the DesignSystem import** with the **inlined design system** block below (so the file has no external design-system import).

---

## 1. ReferralForm (used on /submit-referrals)

1. In Framer: **Code** → open the code file used by the **submit-referrals** page (ReferralForm).
2. **Find** this entire block (including the blank line after it):

```
import {
    COLORS as C,
    RADIUS,
    FROSTED_GLASS,
    BUTTON_PRIMARY,
    BUTTON_SECONDARY,
    INPUT_BASE,
    SHADOWS,
    TRANSITION,
} from "../DesignSystem"
```

3. **Replace** with the block under "Inlined block for ReferralForm" below.
4. Save. Try publishing again.

---

## 2. ReferralDashboard (used on /dashboard)

1. In Framer: **Code** → open the code file used by the **dashboard** page (ReferralDashboard).
2. **Find** this entire block:

```
import {
    COLORS,
    FONT,
    RADIUS,
    FROSTED_GLASS,
    BUTTON_PRIMARY,
    BUTTON_SECONDARY,
    SHADOWS,
    TRANSITION,
} from "../DesignSystem"
```

3. **Replace** with the block under "Inlined block for ReferralDashboard" below.
4. Save. Try publishing again.

---

## 3. ReferralSourcePortal (used on /portal)

1. In Framer: **Code** → open the code file used by the **portal** page (ReferralSourcePortal).
2. **Find** this line:

```
import { COLORS, FONT, RADIUS, FROSTED_GLASS, BUTTON_PRIMARY, BUTTON_SECONDARY, SHADOWS, TRANSITION } from "../DesignSystem"
```

3. **Replace** with the block under "Inlined block for ReferralDashboard" (same as dashboard — it includes gunmetal, moonstone, overlay, etc.).
4. Save. Try publishing again.

---

## Inlined block for ReferralForm

Paste this **exactly** (replace the import block with this):

```
// ----- Inlined design system (no import) -----
const COLORS = {
    ash: "#2B2828",
    ashMuted: "rgba(43, 40, 40, 0.6)",
    ashSubtle: "rgba(43, 40, 40, 0.15)",
    coconut: "#E9EDF6",
    coconut50: "rgba(233, 237, 246, 0.5)",
    coconut25: "rgba(233, 237, 246, 0.25)",
    shell: "#F8F6F1",
    white: "#FFFFFF",
    success: "#059669",
    successBg: "#d1fae5",
    error: "#991B1B",
    errorBg: "#fee2e2",
    errorText: "#c0392b",
    border: "rgba(43, 40, 40, 0.12)",
    borderLight: "#E2E8F0",
    textMuted: "rgba(43, 40, 40, 0.6)",
    infoBg: "#EFF6FF",
    infoBorder: "#BFDBFE",
    infoText: "#1E40AF",
}
const C = COLORS
const RADIUS = { card: "12px", input: "12px", section: "12px", modal: "16px", container: "16px", pill: "100px", small: "8px" }
const FONT = `"Montserrat", sans-serif`
const SHADOWS = { card: "0 2px 12px rgba(43, 40, 40, 0.06)", cardHover: "0 4px 20px rgba(43, 40, 40, 0.08)", modal: "0 24px 48px -12px rgba(43, 40, 40, 0.15)" }
const TRANSITION = "all 0.2s ease"
const FROSTED_GLASS: React.CSSProperties = {
    background: COLORS.coconut25,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.card,
    boxSizing: "border-box",
}
const BUTTON_PRIMARY: React.CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: COLORS.shell,
    backgroundColor: COLORS.ash,
    border: "none",
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}
const BUTTON_SECONDARY: React.CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: COLORS.ash,
    backgroundColor: "transparent",
    border: `2px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}
const INPUT_BASE: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    fontFamily: FONT,
    color: COLORS.ash,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.white,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
}
// ----- End inlined design system -----
```

---

## Inlined block for ReferralDashboard

Paste this **exactly** (replace the import block with this):

```
// ----- Inlined design system (no import) -----
const COLORS = {
    ash: "#2B2828",
    ashDark: "#181818",
    ashMuted: "rgba(43, 40, 40, 0.6)",
    ashSubtle: "rgba(43, 40, 40, 0.15)",
    coconut: "#E9EDF6",
    coconut50: "rgba(233, 237, 246, 0.5)",
    coconut25: "rgba(233, 237, 246, 0.25)",
    shell: "#F8F6F1",
    white: "#FFFFFF",
    gunmetal: "#45434c",
    moonstone: "#7EACB5",
    moonstoneLight: "rgba(126, 172, 181, 0.2)",
    tangerine: "#FFA089",
    tangerineLight: "rgba(255, 160, 137, 0.3)",
    champagne: "#F5E4C8",
    champagneLight: "rgba(245, 228, 200, 0.3)",
    success: "#059669",
    successBg: "#d1fae5",
    green: "#d1fae5",
    greenText: "#059669",
    error: "#991B1B",
    errorBg: "#fee2e2",
    redText: "#c0392b",
    border: "rgba(43, 40, 40, 0.12)",
    borderLight: "#E2E8F0",
    textMuted: "rgba(43, 40, 40, 0.6)",
    overlay: "rgba(27, 36, 42, 0.5)",
}
const RADIUS = { card: "12px", input: "12px", section: "12px", modal: "16px", container: "16px", pill: "100px", small: "8px" }
const FONT = `"Montserrat", sans-serif`
const SHADOWS = { card: "0 2px 12px rgba(43, 40, 40, 0.06)", cardHover: "0 4px 20px rgba(43, 40, 40, 0.08)", modal: "0 24px 48px -12px rgba(43, 40, 40, 0.15)" }
const TRANSITION = "all 0.2s ease"
const FROSTED_GLASS: React.CSSProperties = {
    background: COLORS.coconut25,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.card,
    boxSizing: "border-box",
}
const BUTTON_PRIMARY: React.CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: COLORS.shell,
    backgroundColor: COLORS.ash,
    border: "none",
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}
const BUTTON_SECONDARY: React.CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: COLORS.ash,
    backgroundColor: "transparent",
    border: `2px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}
// ----- End inlined design system -----
```

---

After all replacements (ReferralForm, ReferralDashboard, ReferralSourcePortal), save and publish again. The publish errors should be resolved.
