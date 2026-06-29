# Syncing code into Framer (copy & paste)

The repo is the **source of truth**. After editing files here, copy the code into Framer so the live site uses the latest version.

## DesignSystem in Framer

**Status:** DesignSystem.tsx is saved in Framer. When you change `Code/DesignSystem.ts` in the repo, paste the updated content into Framer’s DesignSystem.tsx (and keep the `export default function DesignSystem() { return null }` at the end if you added it). The Code panel lists AuthGateway, DocumentUploadForm, ReferralForm, ReferralDashboard, PublicInquiryForm, ReferralSourcePortal, etc., but no `DesignSystem.ts` or `DesignSystem.tsx`.

**Repo vs Framer:** In the repo, AuthGateway and all forms **import from `../DesignSystem`**. In Framer, code components are bundled in isolation and often cannot resolve imports to other code files (e.g. `./DesignSystem`). So for **AuthGateway** and **DocumentUploadForm**, use the **Framer paste versions** in `Code/Framer/` — they have the design tokens inlined and no DesignSystem import, so publish succeeds.

**Recommended approach:**

1. **Update DesignSystem in Framer when the repo changes**
   - Open **DesignSystem.tsx** in Framer and paste the contents of `Code/DesignSystem.ts`. If Framer requires a default export, keep `export default function DesignSystem() { return null }` at the end. Save.

2. **Fix import path when pasting components**
   - Repo uses `from "../DesignSystem"` (or `from "../DesignSystem"` from `Code/OAuth/`).
   - In Framer all these files are siblings, so use **`from "./DesignSystem"`** in every pasted component that imports the design system (AuthGateway, DocumentUploadForm, ReferralForm, ReferralDashboard, ReferralSourcePortal, PublicInquiryForm).
   - So when pasting: after pasting, do a find/replace in that file: `from "../DesignSystem"` → `from "./DesignSystem"`.

3. **Sync order**
   - Sync **DesignSystem first** (create + paste as above).
   - Then sync AuthGateway, DocumentUploadForm, and any other form/dashboard; fix the import to `./DesignSystem` in each.

## Quick sync: AuthGateway and DocumentUploadForm

**Use the Framer paste versions** so publish works without DesignSystem imports:

1. **AuthGateway** (`/login` and `/admin`)
   - **Repo file:** `Code/Framer/AuthGateway.tsx` (self-contained; design tokens inlined, no DesignSystem import). URL constants at top must stay in sync with `Code/config/monarchProgramCompetency.ts` (`referralPartnerLoginPath`, `staffLoginPath`).
   - In Framer: paste into **AuthGateway** on **both** the `/login` and `/admin` pages. Save both.

2. **DocumentUploadForm** (document upload page)
   - **Repo file:** `Code/Framer/DocumentUploadForm.tsx` (self-contained; design tokens inlined, no DesignSystem import)
   - In Framer: Code → **DocumentUploadForm** → paste full file, replace all. No import change needed. Save.

ReferralForm, ReferralDashboard, and ReferralSourcePortal in `Code/Framer/` also **inline** design tokens (paste as-is).

## All code components that may need syncing

| Repo file | Framer code file | Notes |
|-----------|------------------|--------|
| `Code/DesignSystem.ts` | **DesignSystem.tsx** (in Framer) | When updating: paste repo file; keep default export at end if needed |
| `Code/Framer/AuthGateway.tsx` | AuthGateway.tsx | Inlined tokens — paste as-is |
| `Code/Framer/DocumentUploadForm.tsx` | DocumentUploadForm.tsx | Inlined tokens — paste as-is |
| `Code/Framer/ReferralForm.tsx` | ReferralForm.tsx | Inlined tokens — paste as-is |
| `Code/Framer/ReferralDashboard.tsx` | ReferralDashboard.tsx | Inlined tokens — paste as-is |
| `Code/Framer/ReferralSourcePortal.tsx` | ReferralSourcePortal.tsx | Inlined tokens — paste as-is |
| `Code/Framer/PublicInquiryForm.tsx` | PublicInquiryForm.tsx | Inlined tokens — paste as-is |
| `Code/Framer/ReferralSharePage.tsx` | ReferralSharePage.tsx (`Project/ReferralSharePage.tsx`) | **Static page path `/r`** (Framer does not treat `/r/:token` as a dynamic segment). ROI URLs: `https://monarchy.framer.website/r?token=…` |

After pasting, use Framer’s preview to confirm login, document upload, and forms behave as expected.

## If publish fails on /login or /submit-referrals/documents

Publish errors on those pages are usually from **DesignSystem not being resolved** when Framer bundles each code component in isolation (imports to other code files may not resolve).

**Fix:** Paste the **Framer-specific versions** that have no DesignSystem import:

1. **AuthGateway** — In Framer’s AuthGateway code component, paste the full contents of **`Code/Framer/AuthGateway.tsx`** (design tokens are inlined at the top; no `import ... from "./DesignSystem"`). Save.
2. **DocumentUploadForm** — In Framer’s DocumentUploadForm code component, paste the full contents of **`Code/Framer/DocumentUploadForm.tsx`** (design tokens inlined; no DesignSystem import). Save.

Then try publishing again. All production components live in **`Code/Framer/`** only (`Code/Framer/` was removed). Edit there, then paste into Framer.
