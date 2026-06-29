# Referral detail modal — layout reorganization

**Status:** D1–D6 shipped (dashboard + portal layout parity)  
**Scope:** `Code/Framer/ReferralDashboard.tsx` (`SubmissionDetailModal`) and `Code/Framer/ReferralSourcePortal.tsx` (`ReferralDetailModal`)  
**Goal:** Keep the referral record as a linear, form-aligned scroll — but move **workflow actions** (status, assignment, exports, notes, messages, documents, requests, links) directly under the header so repeat visits are action-first.

---

## Product intent

1. **First open** — Staff and sources often read the referral top-to-bottom (matches `ReferralForm` section order). That flow stays.
2. **Return visits** — Users reopen the modal to **do something** (change status, assign, request docs, message, export). Those controls should not live at the bottom of a long scroll.
3. **Parity** — Portal workflow blocks should mirror dashboard semantics (same section-note keys, same document/request/link patterns). Portal remains mostly read-only on PHI; messaging and notes stay open.

---

## Target layout (both apps)

```
┌─ Sticky header ─────────────────────────────────────────────┐
│ Client name · IDs · badges · ✕ close                        │
├─ Sticky toolbar (dashboard only; portal: upload CTA) ──────┤
│ Status · Assignee · Export ▾ · Archive                      │
├─ Scrollable body ───────────────────────────────────────────┤
│ WORKFLOW ZONE (action-first)                                │
│   Status timeline                                           │
│   Section statuses (ROI · Insurance · Safety workflow)      │
│   Section notes (collapsible)                               │
│   Messages (collapsible)                                    │
│   Documents & attachments                                   │
│   Request documents (dashboard) / Documents requested (portal) │
│   Share links                                               │
│ ─── divider / visual break ───                              │
│ REFERRAL RECORD (form order, read-mostly)                   │
│   Client → Source → Contacts → … → Urgency & notes          │
│   Activity (collapsible, dashboard)                         │
│   [Review history — staff only, see below]                  │
│   [Audit metadata — hide or admin-only, see below]          │
└─────────────────────────────────────────────────────────────┘
```

**Footer:** Remove duplicate **Close** (header ✕ is enough). Dashboard footer can be removed entirely once toolbar holds actions, or kept as a thin spacer only.

---

## ReferralDashboard — toolbar spec

Move from **footer** to a **sticky row below the header** (left → right):

| Control | Current | Target |
|--------|---------|--------|
| **Status** | Footer `StatusDropdown` | Toolbar — unchanged behavior |
| **Assignment** | “Assign to me” / “Unassign” buttons | **Single `<select>`:** `Unassigned` → `Assign to me` → all other assignable admissions staff (display name + “(you)”) |
| **Export** | Separate Print/PDF, Export Text, ZIP buttons | **One dropdown:** Print/PDF · Export text · Export CSV (single row) · ZIP attachments (disabled when no files) |
| **Archive** | Footer button | Toolbar — keep archive / unarchive |

### Assignment dropdown — engineering notes

- Today `staffAssigneeByUserId` only loads profiles for **current user + already-assigned** IDs (`admissions_staff_profiles` batch by ID). A full assignee list needs a **new data source** (e.g. active `staff_program_memberships` for the referral’s program + join to published `admissions_staff_profiles`, or a small RPC).
- Playground reference: `Code/playground/dashboard-ui/src/components/ReferralStaffAssignmentFields.tsx` (`staffForProgram` + select). Mirror that UX; optional “Assign to me” can remain as first option in the select instead of a second button.
- Changing assignee should continue to call existing `onAssignmentChange(referralId, userId | null)`.

### Export dropdown — corrections

| Menu item | Exists today? | Notes |
|-----------|---------------|--------|
| Print / PDF | Yes (`exportSubmissionPDF`) | One action opens print-friendly HTML — label “Print / PDF” in menu is fine |
| Export text | Yes (`exportSubmissionText`) | Plain-text download |
| Export CSV (referral only) | Yes | Single-row `exportSubmissionsCSV([referral], …)` |
| Export CSV (with section notes) | **Implemented (D1)** | Same CSV + `notes_{section_key}` columns (inline text per section) |
| Export section notes (CSV) | **Implemented (D1)** | Separate file: one row per note (`referral_id`, section, author, internal flag, content) |
| ZIP attachments | Yes (`zipReferralSubmissionsAttachments`) | Disable when `uploaded_documents` empty |

---

## Section notes — anchored to record sections (core model)

**Section notes ≠ Messages.** Messages are a bilateral thread. Section notes are **staff/source annotations tied to a specific part of the referral record**, composed from one hub but **displayed in context**.

### Workflow (clinical director example)

1. Director asks admissions to document something under **Medical / somatic**.
2. Staff opens modal → **Section notes** → dropdown **Medical / somatic** → writes note.
3. Note is stored with `section_key = medical` and appears:
   - In the **Section notes** hub (compose + full list), and
   - At the **bottom of the Medical / somatic** section (and anywhere else that section is shown, including export).

### Implementation (dashboard, started in D1)

| Piece | Status |
|-------|--------|
| `SECTION_NOTE_KEYS` aligned to modal sections | Done |
| `SectionInlineNotes` at bottom of each record `ModalSection` | Done (dashboard) |
| Legacy `general` notes mapped to **Other** | Done |
| Portal inline notes + shared keys | D5 |
| PDF/print export includes inline section notes | Done (D6) |
| Bulk list CSV with notes columns | Optional (`exportSubmissionsCSV` 4th arg) |

### Dropdown keys (`section_key`)

`client` · `source` · `contacts` · `documents` · `inventory` · `legal` · `location` · `risk` · `clinical` · `substance` · `medical` · `insurance` · `urgency` · `other`

Internal notes (`is_internal = true`): staff-only via RLS; never shown in portal.

---

## Workflow zone — section order (dashboard)

After toolbar, **before** Client Demographics:

1. **Status timeline** — move up from current position (already loaded from `referral_status_history`).
2. **Section statuses** — ROI, Insurance, Safety (`referral_section_statuses`; dashboard editable, portal read-only).
3. **Section notes** — **collapsible**; expand when adding/viewing notes.
4. **Messages** — **collapsible**.
5. **Documents & attachments** — keep current collapsible chrome + ZIP-in-section behavior; ZIP also in toolbar export menu.
6. **Request documents** — staff send batch (`sectionId="modal-section-documents"` preserved for deep links).
7. **Share links** — keep create/copy/revoke (`sectionId="modal-section-share-links"` preserved).

Then **referral record** in form order:

- Client Demographics → Referral Source → Contacts → Legal / Court → Current Location / Facility → Risk Assessment → Mental Health & Clinical → Substance Use → Medical / Somatic → Insurance / Benefits → Urgency & Notes

**Tail (dashboard only):**

- **Activity** — collapsible; keep `referral_activity_log` feed.
- **Review history** — see clarifications below.
- **Audit trail** — see clarifications below.

---

## ReferralSourcePortal — toolbar & workflow

| Area | Target |
|------|--------|
| **Toolbar** | Primary: **Upload documents** (link to `docsUrl` / upload flow) + icon; replaces footer “Upload documents for this referral →” |
| **Progress** | Group **status progress bar** (existing) + **status timeline** + **section statuses** (read-only) under one “Progress” heading |
| **Workflow** | Same order as dashboard: notes → messages → documents → documents requested → share links |
| **Record** | Align read-only sections with dashboard where data exists |

### Portal sections — current vs target

| Section | In portal today? | Action |
|---------|------------------|--------|
| Client Demographics | Yes | Keep |
| Referral Source | Yes | Keep |
| **Contacts** | **No** | **Add read-only** (emergency + additional contacts) — parity with dashboard |
| Legal / Court | Yes | Keep |
| Current Location | Yes | Keep |
| Risk Assessment | Yes | Keep |
| Mental Health & Clinical | No | Add read-only when reorganizing record block |
| Substance Use | No | Add read-only |
| Medical / Somatic | No | Add read-only |
| Insurance / Benefits | No | Add read-only |
| Urgency & Notes | No (partial: no dedicated section) | Add read-only (urgency fields + notes) |

Internal staff notes: **already enforced** — RLS on `referral_section_notes` hides `is_internal = true` from sources; portal insert always sets `is_internal: false`. Sources never see internal notes or that they exist. No change required beyond copy QA.

---

## Section note dropdown — new keys

Replace workflow-oriented keys with **modal-section-aligned** keys (both apps, shared constant):

| Value | Label |
|-------|--------|
| `client` | Client |
| `source` | Referral source |
| `contacts` | Contacts |
| `documents` | Documents |
| `inventory` | Document inventory |
| `legal` | Legal / court |
| `location` | Location / facility |
| `risk` | Risk assessment |
| `clinical` | Mental health & clinical |
| `substance` | Substance use |
| `medical` | Medical / somatic |
| `insurance` | Insurance / benefits |
| `urgency` | Urgency & notes |
| `other` | Other |

**Migration:** `section_key` is free text in DB. Map legacy keys in UI labels only (`general` → “General (legacy)”) or one-time SQL backfill before switching dropdown options. New notes use new keys only.

---

## Section statuses — “Safety” clarification

**Safety is not the Risk Assessment form.** They are separate concepts:

| | Risk Assessment (modal section) | Safety (section status dropdown) |
|--|-----------------------------------|----------------------------------|
| **What** | Submitted answers: violence / suicide / elopement risk | Staff workflow tracker on `referral_section_statuses.section_key = 'safety'` |
| **Who edits** | Source at submit (future: source edit per locking rules) | Admissions staff only |
| **Purpose** | Clinical flags at intake | Track safety **clearance / planning** workflow (e.g. safety plan, hold, bed-fit) independent of overall referral status |

**Recommendation:** Keep the Safety workflow row for now; relabel UI to **“Safety workflow”** to avoid confusion with Risk Assessment. Revisit removal only after admissions SOP confirms it is unused.

ROI and Insurance workflows are similarly **process trackers**, not duplicates of the Insurance / Benefits form section.

---

## Review history & audit trail — corrections

### Review history

- **Partially wired today:** `SubmissionDetailModal` reads `referral.reviewed_by`, `reviewed_at`, `review_notes` from `referral_submissions`.
- **Gap:** No in-modal UI to **set** review fields (likely intentional until review SOP is defined).
- **Recommendation:** Move below Activity; keep read-only until a “Mark reviewed” action is specified. Low priority.

### Audit trail (collapsible block today)

- **Not** the HIPAA `referral_activity_log` — it shows **submission metadata** (IP, user agent, form completion %, session id, auto-save).
- Useful for support/debug; **not** day-to-day admissions work.
- **Recommendation:** Remove from default admissions view, or gate behind Administration / super-admin. Do not invest in expanding until Activity log covers operational history.

---

## Deferred — source edit & locking (do not implement in layout phase)

Referring sources may eventually **edit incomplete referrals** and update location/contacts/urgency; they must **not** edit status, staff notes, third-party PHI, MAR, or post-review risk answers.

**Locking (critical, later):**

- Auto-lock at `under_review` and/or per-section locks after submit
- Staff override to lock entire referral
- Sources retain: messages, non-internal notes, status visibility, document upload

Requires schema/RLS/product rules — **explicitly out of scope** for modal layout work. Document only; implement after layout + workflow UX is stable.

---

## Implementation priority order

Phases **D1–D6** are **layout/UX** (distinct from completed theme Phases A–C).

### D1 — Dashboard sticky toolbar (highest impact) — **partially shipped**

- [x] Sticky header + toolbar wrapper (`MODAL_TOOLBAR_*`).
- [x] Status, Export menu (PDF, text, CSV ×2, notes CSV, ZIP), Archive in toolbar.
- [x] Assignee `<select>` (limited to known profiles until D2).
- [x] Footer removed (Close via header ✕ only).
- [x] Section note keys + `SectionInlineNotes` on record sections.
- [x] D3 reorder (workflow zone above record; divider before Client Demographics).

### D2 — Assignment staff directory — **shipped**

- [x] RPC `list_assignable_staff_for_program` + admin fallback.
- [x] Toolbar `<select>` lists active program members (display name + “(you)”).
- [x] `onAssignmentChange` unchanged; kanban/list refresh via existing profile batch load.

### D3 — Reorder dashboard body (workflow up, record down) — **shipped**

- [x] DOM reorder in `SubmissionDetailModal` — no behavior change.
- [x] `sectionId` anchors preserved (`modal-section-documents`, `modal-section-share-links`).
- [x] `MODAL_RECORD_DIVIDER_STYLE` between workflow zone and referral record.

### D4 — Collapsible workflow sections — **shipped**

- [x] `CollapsibleModalSection` (chrome bar toggle, count badge when collapsed).
- [x] Dashboard: Section notes, Messages, Activity — default collapsed.
- [x] Portal: Section notes, Messages — default collapsed.

### D5 — Portal layout parity — **shipped**

- [x] Sticky toolbar **Upload documents** CTA; footer upload link removed.
- [x] Workflow order: Progress (bar + timeline + section statuses) → notes → messages → documents → requested → share links → record.
- [x] `MODAL_RECORD_DIVIDER_STYLE` before referral record.
- [x] Read-only record sections: Contacts, Clinical, Substance, Medical, Insurance, Urgency (expanded demographics/legal/location/risk).
- [x] Shared `SECTION_NOTE_KEYS`, `SectionInlineNotes` on all record sections.

### D6 — Section note keys + polish — **shipped**

- [x] Dashboard keys + inline anchors (moved up from D6).
- [x] Portal keys + inline anchors (D5).
- [x] Relabel Safety → “Safety workflow” (dashboard + portal; FAQ copy updated).
- [x] PDF export includes per-section notes (modal + list export fetches notes).

### Later (separate epics)

| Epic | Scope |
|------|--------|
| **Source editable sections** | PATCH API, field-level allowlist, validation |
| **Referral locking** | Status triggers, section locks, staff lock toggle |
| **Review workflow** | Set `reviewed_by` / `review_at` from modal |
| **Audit metadata** | Admin-only surface or remove |

---

## Suggestions & risks

1. **Sticky stacking** — Header + toolbar both sticky: define explicit `top` offsets and test dark mode + narrow widths (toolbar wraps).
2. **Mobile / narrow modal** — Export and assignment may need icon-only or overflow menu under ~720px.
3. **Deep links** — Kanban/actions that pass `scrollSection` must still resolve after reorder (keep element ids).
4. **Portal scroll container** — Portal modal uses inner scroll div; toolbar stickiness must be relative to that container, not only dashboard pattern.
5. **Do layout before locking** — User note is correct: get sections in the right place before edit/lock rules.
6. **CSV export** — Confirm whether single-referral CSV should match bulk `exportSubmissionsCSV` columns (including assignee fields) for Ritten/admissions consistency.

---

## Acceptance checklist (layout complete)

- [x] Dashboard: status, assignee, export, archive reachable without scrolling to footer
- [x] Section notes appear at bottom of targeted record section (dashboard)
- [x] CSV: referral only · with inline notes · notes-only file
- [x] Dashboard: workflow blocks appear above Client Demographics in specified order
- [ ] Dashboard: footer Close removed; header ✕ only
- [x] Portal: upload action in toolbar; footer upload link removed
- [x] Portal: workflow order matches dashboard; Progress groups timeline + section statuses
- [x] Portal: Contacts + missing clinical/insurance/urgency sections visible read-only
- [x] Section note dropdown uses modal-aligned keys (both apps)
- [ ] Internal notes remain invisible to sources
- [ ] `scrollSection` deep links still work
- [ ] Theme tokens (`MODAL_*`) reused for toolbar/collapsibles — no new hardcoded colors

---

## Reference — current modal section order (pre-change)

**Dashboard (`SubmissionDetailModal`):** Demographics → Source → Contacts → Documents → Request docs → Legal → Location → Risk → Clinical → Substance → Medical → Insurance → Urgency → Review history → Status timeline → Share links → Section notes → Messages → Section statuses → Activity → Audit → **footer actions**.

**Portal (`ReferralDetailModal`):** Progress → Demographics → Source → Legal → Location → Risk → Documents requested → Documents → Status timeline → Share links → Section statuses → Section notes → Messages → **footer upload link**.
