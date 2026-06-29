# Site decisions and assessments

Answers and options for Nav/Resources, Dashboard auth, Legal/Resources CMS, forms styling, and referral notifications. Use this when implementing.

---

## 1. Nav — Remove Newsletter, build Resources page

**Decision:** Remove the newsletter and build a dedicated **Resources** page that better suits needs. Resources are ordered by **type and priority from a site visitor’s perspective.**

**Page structure (top to bottom):**

1. **Page briefing** — Short intro at the top explaining what this page is and how it’s organized.
2. **Emergency & critical resources** — Crisis and emergency numbers (mental health, suicide prevention, etc.) first.
3. **Monarch programs** — Monarch Mental Health, Monarch Sober Living, Monarch Launch (and any other Monarch programs), with brief descriptions and links/contacts.
4. **Community partners** — Community partner contacts and info.
5. **Fellowship & meetings** — AA meetings, 12-step meetings, fellowship info and contacts.
6. **Other resources** — Reserved space for additional resources, info, and contacts (e.g. food banks, law/policy updates, client PDFs).

**Implementation:** Start **without CMS** (static sections and copy). Add CMS later if the list grows or you want non-designers to edit.

**Done (Framer MCP):** The former Newsletter page was rebuilt as Resources with: hero “Resources,” page briefing, Emergency & crisis (988, Colorado Crisis), Monarch programs, Community partners, Fellowship & meetings, Other resources. Footer link updated to “Resources” → `/resources`. Briefing and section cards use Coconut-bg and Shell-bg; text uses project styles (Headings/Heading 3, 4, Body Medium). **You:** In Framer, set this page’s URL from `/newsletter` to `/resources` in page settings so the footer link works. Fonts: Priego (headers; no special chars), Konkret Grotesk, Nohemi, Unigeo; site palette Ash, grays, Coconut, Shell, subtle Tangerine; photos B&W.

---

## 2. Dashboard link and sign-in (private access)

**Current:** Dashboard link only in dev; it needs to be private (not for the public).

**One sign-in for both admin and referral sources:** Yes, it can work with **one** “Sign in” (e.g. “Sign in with Google”).

- **How it works today (code):**
  - **ReferralDashboard** uses `ALLOWED_DOMAIN = "monarchcompetency.com"`. After sign-in, it checks the user’s email: if `@monarchcompetency.com` → full dashboard; otherwise it shows “Access restricted to @monarchcompetency.com accounts.”
  - **AuthGateway** uses Supabase Auth with Google OAuth (and magic link). Redirect is to the secure-referral flow.
- **So:** Same Google Auth can serve both. You do **not** need a separate login for admins. After sign-in:
  - **@monarchcompetency.com** → allow access to Admin Dashboard (and optionally hide “Dashboard” from nav for others).
  - **Other domains** → redirect to Referral Source Portal / Submit Referral (or “My Referrals” when the portal exists); they never see the admin dashboard because the dashboard page itself rejects non–@monarchcompetency.com.

**Implementation:** Use a single “Sign in” (e.g. in header or a dedicated /sign-in page) with Google OAuth. After auth, redirect by role:

- If email ends with `@monarchcompetency.com` → redirect to `/dashboard` (or show dashboard).
- Else → redirect to `/submit-referrals` or `/portal` (referral source experience).

The Dashboard URL can stay unlinked from the public nav; only staff who sign in with a Monarch email get sent there. Optionally add a small “Staff” or “Dashboard” link that appears only for @monarchcompetency.com users after sign-in.

**Framer Memberships vs existing Auth:** You do **not** need Framer Memberships. Use your existing Auth (Supabase + Google OAuth) and a “Sign in” in the header that opens your AuthGateway or redirects to your sign-in flow. Styling: match the site aesthetic — Ash, grays, Coconut, Shell, subtle Tangerine; photos B&W. Style the sign-in button and any auth modal/overlay to use the same colors and fonts (Priego, Konkret Grotesk, Nohemi, Unigeo) so it feels part of the site.

---

## 3. Submit-referrals and Dashboard breakpoints

**Status:** Submit-Referrals now has tablet and mobile; Dashboard already had tablet/mobile. No further action needed unless you see layout issues on real devices.

---

## 4. Legal CMS (footer links)

**Need:** Legal pages linked from the footer; you may add more over time.

**Use:** A **Legal** (or “Legal & policies”) CMS collection is a good fit: one item per page (e.g. Privacy Policy, Terms of Use, Client Rights). Each item: title, slug/url, optional short label for footer, optional “order” for sort. Footer component reads the collection and renders links. Add new legal pages as new CMS items; no code change. If you prefer not to use CMS, a fixed list of links in the footer component is fine until you have many legal pages.

---

## 5. Resources CMS — assessment

**Content you described:** Community partners, helplines, food banks, fellowship programs, CO competency law updates, policy changes, other Monarch programs, client PDFs (rights, pre-admission checklist, what to bring).

**Assessment:**

- **CMS is not strictly necessary** if the list is small and changes rarely. You can build the Resources page with fixed sections (e.g. “Community partners,” “Crisis & helplines,” “Client downloads”) and hard-coded links/text. Easier to set up; you edit the page in Framer when something changes.
- **CMS becomes useful when:**
  - You have many resources (e.g. many partners or many PDFs) and want to add/remove/reorder without editing the page.
  - Multiple people need to update resources without touching the design.
  - You want a consistent card layout (icon/photo, title, contact, description, link) driven by data.

**Recommendation:**

- **Start without CMS:** Build one Resources page with sections and a few cards/links. Use Framer’s link + file upload for PDFs (e.g. client rights, pre-admission checklist, what to bring). Quick to ship.
- **Add CMS later** if the list grows or you want non-designers to manage content. Then either:
  - **Repurpose Newsletter CMS** (if it exists): rename to “Resources,” add fields (title, description, link, category, image/icon, order), and repoint the Resources page to this collection; or
  - **New “Resources” collection:** same idea (category, title, description, link, optional image, order). Use categories: e.g. “Community partners,” “Crisis & helplines,” “Client downloads,” “Other Monarch programs,” “Law & policy.”

So: **CMS optional for launch; add or repurpose when you need easier updates or more items.**

---

## 6. Forms styling and responsive behavior

**Ask:** Now that there’s a direct reference (live site / Framer), can we restyle the forms to match the main site (colors, spacing, animations, hover effects)?

**Answer:** Yes. The form components live in the repo (`Code/Framer/*.tsx`) and are the same as in Framer. To match the site we’d:

- **Colors:** Use the same palette as the site (e.g. Gunmetal, Champagne, Moonstone, Tangerine, Coconut from your styles) in the form constants (e.g. `COLORS` in ReferralForm/ReferralDashboard).
- **Spacing and typography:** Align padding, radius, font sizes, and font family with the rest of the site.
- **Hover/animations:** Add transitions on buttons and inputs; optional subtle animations (e.g. section focus) to match site feel.
- **Responsive:** Forms already use `isMobile`/width checks; we’d refine breakpoints and layout (stacking, font sizes, touch targets) so tablet/mobile match the main site’s responsive behavior.

Best approach: share the live Framer URL (or a screenshot/list of color tokens and spacing), then we can update the form code in the repo and you can paste the updated components into Framer. If Framer MCP is available, we could also read the project’s color styles and apply them by name in the forms.

---

## 7. ReferralForm — notifications for referral sources (when not at desktop)

**Context:** Referral sources already enter phone and email. You’re considering: preferred contact method, acceptable hours, can we leave messages. You want the **simplest** way for them to receive updates as referrals move through your process. Portal = desktop; you want options when they’re **not** at their desk.

**Options (simplest first):**

1. **Email only (simplest)**  
   - Use the email they provided. Send transactional emails at key steps: “We received your referral,” “Status update: Under review,” “ROI signed,” “Decision: accepted/waitlisted/declined,” etc.  
   - No extra fields. Works everywhere (phone, tablet, desktop).  
   - **Implementation:** Backend (Supabase Edge Function or your email provider) triggered when status changes; send to `referral_source_email`.

2. **Email + preference (still simple)**  
   - Add optional fields: “Preferred contact: Email / Phone / Either”; “Best times to contact”; “OK to leave voicemail?”  
   - Still send status emails by default; use preferences for staff when they need to call.  
   - **Implementation:** Add columns or JSONB to `referral_submissions` (or to `referral_source_profiles` when that exists). Forms collect; dashboard shows; emails unchanged.

3. **SMS (optional)**  
   - For “not at desktop,” SMS is effective. Add optional “Mobile number for text updates” and a checkbox “Send status updates by text.”  
   - **Implementation:** Twilio (or similar) in an Edge Function; send short messages at same events as email. More setup and cost; best as a Phase 2 after email is stable.

4. **Portal + email (and optional SMS)**  
   - Portal for when they’re at a computer; email (and optionally SMS) for when they’re not. Same status events drive both.  
   - Matches your spec (REFERRAL_SOURCE_PORTAL.md): “Email notifications” toggles in My Profile (status changes, ROI signed, etc.).  
   - **Implementation:** `referral_source_profiles` stores preferences; one notification pipeline that respects “email on/off,” “SMS on/off,” and “preferred contact method.”

**Recommendation:**

- **Now:** Rely on **email** to the address they already give. Add optional fields on the form: “Preferred contact method” (Email / Phone / Either), “Best times to contact,” “OK to leave voicemail?” — for staff use, not for auto-SMS.
- **Next:** When you have status timeline and backend updates, add **automated status emails** (received, under review, ROI signed, decision). No portal required for that.
- **Later:** Build the portal (My Referrals, timeline, preferences). Add **My Profile** toggles for “Email me on status change” etc. Optionally add SMS if you want “not at desktop” covered by text.

So: **one Google Auth, domain-based routing for Dashboard vs referral source; email for updates is the simplest; optional preferences and SMS can layer on.**

---

## Framer tasks that need MCP (not done this session)

These require Framer MCP; when it’s available we can:

1. **Home Program Pillars:** Remove web design/branding/animation copy; rebuild section as a short program outline (housing, curriculum-based programs, case management, competency/restoration, 24hr clinical support).
2. **Our Program:** Remove Vermeer/paint copy; expand with pillars + community reintegration, transportation, curriculum.
3. **Instruction layers:** Find and remove Instruction layers from the project.

**FORM_EMAILS.md** is already in place (referrals@, hello@, admissions@ unchanged). No change needed there.
