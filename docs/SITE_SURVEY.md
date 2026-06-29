# Site survey (pre–referral source dashboard)

Snapshot of the Framer site after your recent changes (FAQs finished, FAQ Tabs relocated). Use this before implementing the referring source dashboard.

---

## MCP tools available

**Framer MCP:** The following work in this session:

- **getProjectXml** — Project structure (pages, components, code components, color/text styles)
- **getNodeXml** — XML for a page or component by nodeId
- **updateXmlForNode** — Update/create nodes, text, attributes
- **deleteNode** — Delete a node (or style/code file)
- **duplicateNode** — Duplicate a node
- **manageColorStyle** / **manageTextStyle** — Create/update color and text styles
- **getComponentInsertUrlAndTypes** — Insert URL and props for components
- **getCMSCollections** / **getCMSItems** / **upsertCMSItem** / **deleteCMSItem** / **createCMSCollection** — CMS read/write (when available)
- **createCodeFile** / **readCodeFile** / **updateCodeFile** — Code components
- **zoomIntoView** — Zoom canvas to a node
- **getProjectWebsiteUrl** — Published site URLs
- **exportReactComponents** — Export Framer components as React

Session-dependent: if a tool is not found, reconnect MCP or retry.

---

## Pages (current)

| Path | nodeId | Notes |
|------|--------|--------|
| / | cEXhBxetu | Home |
| /about | wLA_t4zW0 | About — FAQ section at bottom (see below) |
| /our-program | yhvy68dgt | Our Program |
| /our-program/:slug | KAUIwoWSi | Program detail |
| /resources | fxCupMMp5 | Resources (ex-newsletter) |
| /resources/:slug-slug | nBgr68ROo | Resources slug |
| /program | dvHGyjdRS | **New** — /program page |
| /contact | S6XQzk1Xz | Contact |
| /submit-referrals | mZjPGEjPe | Submit referrals |
| /submit-referrals/documents | iW5uRBjVj | Document upload |
| /dashboard | CfgGiTxE1 | Admin Dashboard |
| /legal/:slug | yAzDiZv6W | Legal |
| /404 | PRxJszoPW | 404 |
| /scratch | kUgitQmyT | Scratch |

---

## /about page — your changes

**Structure (top to bottom):**

1. **Hero** — Full viewport, dark background, image, dots, CONNECT button, Monarch logo/vector (no longer the old “About” text + arrow hero).
2. **ContentWrapper** > **ContentContainer** > **Contents:**
   - MC Logo Divider
   - Line
   - Mission frames (Monarch Competency copy + placeholder “Mission Statement…”)
   - **Team cards** — 8 Team Member Cards (Mike Peterson, Cali Peterson, Claire Kimbel, Greg Maloney, Angie Vereen, Christina Fleishman, plus two more Greg Maloney entries — possible duplicates)
   - **Leadership team** — “leadership team” heading, body copy, GET IN TOUCH button
   - Compassion / Community / Integrity labels + body copy
   - Ticker logos
   - **“A living culture”** — heading + monarch/culture copy
   - **Images** — two images (updated image URLs)
3. **FAQ section at bottom** — **MonarqFaq** (nodeId OZgrIfHb2):
   - Padding 120px top/bottom
   - **Content** (sticky) with:
     - **Header** — “[FAQ]” label, **“Asked.Answered”** title (Priego Medium), subheadline “Let us know if you have any additional questions we can answer for you.”
     - **FaqTabs** — component **FAQ Tabs** (VkyS7yBti)

So the FAQ block is now a single section at the bottom of About with the **FAQ Tabs** component. The old FaqList and FaqContainer (with FAQs MC) are no longer in the About page structure.

---

## New / updated components (from project XML)

**FAQ-related:**

- **FAQs List** (j0ePxFMcP)
- **Accordion 2** (aV6Lxpi6n)
- **Orange FAQ Tab** (FpiKeI0iA)
- **FAQ Tabs** (VkyS7yBti) — used at bottom of /about

**Other:**

- Flip Card 3D Animations, Monarch Ghost Card, Monarch Slider, Pillar Stack, Category Label, Accordion 3, Circle Arrow Button, **MC Logo Divider** (HgwVUZPLV), Navigation Button v2, Footer 2, Sticky Nav, Question, etc.

**Code components added:**

- Workshop/FlipCardFX, ImageRevealCard_1, UltraGlassSocials, Workshop/FloatingNavTab, **HorizontalNavTab**, FlippyBlur, Mycontacts, FlipCardwithContacts, SquareFlipper, etc.

**Code overrides:**

- Examples (R6AXE7v)

---

## Styles

- **Colors:** Coconut (replacing Coconut-bg in some places), Tangerine 2/3, Coconut 50%, Dark, Dark 3, Light 2, etc.
- **Text:** Many new styles (Heading 1L, 2L, Body MED, Body LG, Forms XS, Forms LG, etc.). Headings use Priego; body/forms use Konkret Grotesk, Nohemi.

---

## Referral / dashboard (unchanged in this survey)

- **Submit-referrals** — ReferralForm code component.
- **Dashboard** — ReferralDashboard; restricted to @monarchcompetency.com.
- **Auth** — Supabase + Google OAuth; single sign-in; domain-based routing (Monarch → dashboard, others → referral flow / future portal).

---

## Readiness for referring source dashboard

- **Admin Dashboard** exists and is private (domain check).
- **Referral Source Portal** (for non-Monarch referrers) is **not built**; spec is in `docs/REFERRAL_SOURCE_PORTAL.md` and `docs/PLANNING.md`.
- Next implementation steps: schema (e.g. `referral_status_history`, `referral_source_profiles`, `submitted_by_user_id`), dashboard timeline, then portal core (My Referrals, referral detail with timeline, document upload, profile + notification preferences).

---

*Survey date: from Framer project XML and About page node; MCP tools verified in same session.*
