# Framer site analysis — status and next steps

Summary of findings and your updates. Use this for content/rebuild tasks and when linking forms to the new email addresses.

---

## Done (you fixed)

- **Typos** — Cilent → Client, Claire Kimnel corrected, Contact “how we can help.”
- **Gunmetal** — Color style renamed from Funmetal.
- **Footer Alternate** — Duplicate copy deleted; component not in use yet (still WIP).

---

## Contact form and form emails (not linked yet)

You’re creating two dedicated addresses; link them when ready:

| Use | Email | Where to link |
|-----|--------|----------------|
| **Referral forms** (secure referral, document upload, referral-related) | **referrals@monarchcompetency.com** | ReferralForm, DocumentUploadForm, any referral confirmation/notifications. |
| **General contact** (website contact form, general info, questions) | **hello@monarchcompetency.com** | Contact page form (Name, Email, Message, SEND!). |

- **Contact page form:** Wire the existing form (Framer form or integration) to **hello@monarchcompetency.com** when you connect it.
- **Referral flows:** Use **referrals@monarchcompetency.com** for any emails triggered by referral submission or document upload (e.g. confirmations, “we received your referral”).
- **Admissions (existing):** admissions@monarchcompetency.com remains for direct contact (e.g. Contact page copy). No need to change that unless you want to move general inquiries to hello@.

---

## Home — Program Pillars section (rebuild)

- **Current:** Placeholder about “projects,” “web design, branding, animation” — overkill for what you need.
- **Interim:** Remove any copy that references web design, branding, animation, or generic “projects.”
- **Target:** Rebuild the section as a **brief outline** of how the program is structured, e.g.:
  - Housing  
  - Curriculum-based programs  
  - Case management  
  - Competency / restoration services  
  - 24-hour clinical support  
  - (Any other core pillars you want in the one-line list.)

When the Framer MCP is available, we can replace the placeholder block with this structure and short copy; or you can rebuild the section in Framer and use this as the content brief.

---

## Our Program page (content direction)

- **Role:** Deeper version of the Program Pillars on the home page.
- **Remove:** All Vermeer Paints and paint/artist placeholder copy.
- **Include:** Expand on the main program components, plus:
  - Community reintegration  
  - Transportation  
  - More detail on curriculum  

So: same pillars as home (housing, curriculum, case management, competency/restoration, 24hr clinical support) but with more depth, plus reintegration, transportation, and curriculum. When you’re ready to rewrite or add sections, we can turn this into concrete headings and body copy or apply via MCP.

---

## Instruction layers

- You haven’t seen them on the published site; they can be removed for a cleaner project.
- **Action:** When Framer MCP is available, we can find and remove Instruction layers. Or you can remove them manually in the editor (search for “Instructions” in the layers panel or look for off-canvas note blocks).

---

## Navigation (Newsletter → Resources)

- **Confirmed:** Newsletter is only in the footer by design; you may not keep it.
- **Direction:** Either (a) repurpose Newsletter into a **Resources** page (community partners, helplines, food banks, fellowship programs, CO competency law updates, policy changes, client resources/PDFs), or (b) remove Newsletter and build a dedicated Resources page. See **docs/SITE_DECISIONS_AND_ASSESSMENTS.md** for recommendation (single Resources page; CMS optional at launch).

---

## Submit-referrals and Dashboard — tablet/mobile

- **Status:** Submit-Referrals now shows tablet and mobile; Admin Dashboard already had tablet/mobile breakpoints. No further action unless you see layout issues on real devices.

---

## Summary checklist

| Item | Status |
|------|--------|
| Typos (About, Contact) | Done |
| Gunmetal color style | Done |
| Footer Alternate duplicate | Deleted / not in use |
| Contact form → hello@ | Not linked yet |
| Referral forms → referrals@ | Not linked yet |
| Home Program Pillars | **Done (MCP):** placeholder text replaced with program outline; ProjectsCard removed |
| Our Program | **Done (MCP):** Vermeer/paint copy removed; title “Program Components,” program description in place (expand description in Framer if desired) |
| Instruction layers | **Done (MCP):** removed from Home and Our Program pages |
| Nav (Newsletter → Resources) | Repurpose to Resources or remove; see SITE_DECISIONS_AND_ASSESSMENTS.md |
| Submit-referrals / Dashboard tablet & mobile | Done (both have breakpoints) |
| Dashboard link / sign-in | One “Sign in with Google” can serve admin + referral sources; domain-based routing. See SITE_DECISIONS_AND_ASSESSMENTS.md |
| Legal CMS | Use for footer legal links; add more items as needed |
| Resources CMS | Optional at launch; add or repurpose Newsletter CMS when list grows. See SITE_DECISIONS_AND_ASSESSMENTS.md |
| Forms styling | Can restyle to match site when we have reference (colors, spacing, hover). See SITE_DECISIONS_AND_ASSESSMENTS.md |
| Referral notifications | Email simplest; optional preferences (contact method, hours, voicemail); SMS later. See SITE_DECISIONS_AND_ASSESSMENTS.md |

---

**Framer tasks 1–3** were completed via MCP: Home Program Pillars updated, Our Program Vermeer/paint removed and program content set, Instruction layers deleted. **Task 4:** FORM_EMAILS.md was already in place. Full answers to your questions are in **docs/SITE_DECISIONS_AND_ASSESSMENTS.md**.
