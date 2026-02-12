# Monarch Competency - Referral Management System

## Project Overview
Building a comprehensive referral management system for Monarch (monarchcompetency.com), a mental health organization in Colorado. The system replaces the current website with a modern Framer-based public site, using Supabase for secure referral data transmission. Monarch admissions staff log in to an admin portal to view, organize, and export referral forms for print and EMR import (Ritten.io).

## Tech Stack
- **Frontend**: Framer (visual design tool with code components)
- **Backend**: Supabase (PostgreSQL database with authentication + Storage)
- **Integration**: BuildShip (API workflow management)
- **Forms**: Framer forms → Supabase database
- **Dashboard**: React/TypeScript components embedded in Framer
- **Storage**: Supabase Storage (private bucket for HIPAA-compliant document uploads)

## Architecture
```
[Public Website - Framer]
    ├── Public Inquiry Form → referral_inquiries table
    ├── Secure Referral Form (auth-gated) → referral_submissions table
    ├── Document Upload Page (code + email auth) → Supabase Storage
    └── Admin Dashboard (auth-gated) → reads both tables
        ├── View/sort/filter referrals
        ├── Detail modal with full clinical data
        ├── Export CSV/PDF/text for Ritten.io EMR
        ├── Document viewer with download links
        └── Status workflow management

[Supabase Backend]
    ├── PostgreSQL database (referral_inquiries, referral_submissions)
    ├── Authentication (Google OAuth, Magic Link)
    ├── Row Level Security
    ├── Storage (referral-documents bucket)
    └── Functions/Triggers (referral code generation, auto-archive)

[BuildShip]
    └── API workflow management / integrations
```

## Data Flow
1. **Families & professionals** visit site → submit referrals via forms
2. **Form data** stored in Supabase (`referral_inquiries` for public, `referral_submissions` for professional)
3. **Referral code** auto-generated at submission (e.g. `MON-A4K7`) for post-submission document uploads
4. **Referral source** can upload documents later using code + email verification
5. **Admissions staff** logs in → views/manages referrals via EnhancedReferralForm dashboard
6. **Staff exports** referral data as CSV/PDF/text → prints or imports into Ritten.io

## Key Files
| File | Location | Purpose |
|------|----------|---------|
| `ReferralDashboard.tsx` | `/Code/Forms/` | Admin dashboard (~2,037 lines) |
| `ReferralForm.tsx` | `/Code/Forms/` | Secure professional referral form — 14-step (~2,560 lines) |
| `DocumentUploadForm.tsx` | `/Code/Forms/` | Post-submission document upload page (~500 lines) |
| `PublicInquiryForm.tsx` | `/Code/Forms/` | Public-facing inquiry form (~522 lines) |
| `AuthGateway.tsx` | `/Code/OAuth/` | Authentication gateway component |
| `revised-form-migration.sql` | `/Code/Database/` | Sprint 5 DB migration (~45 new columns, 3 type changes) |
| `auto-archive.sql` | `/Code/Database/` | Sprint 4 archiving SQL |
| `PROJECT.md` | `/` | This file — project overview & changelog |
| `DATABASE.md` | `/` | Database schema reference (~105 columns documented) |

## Workflow
1. Claude edits code files directly
2. After each milestone, copy file contents → paste into Framer
3. Claude updates `PROJECT.md` changelog after each session
4. Database changes documented in `DATABASE.md`
5. SQL migrations run manually in Supabase SQL Editor before deploying updated forms

---

## Changelog

### 2025-02-05 — Project Setup
- Created `PROJECT.md` (this file)
- Created `DATABASE.md` (pending schema audit results)
- Created clean working copy `ReferralDashboard.tsx` (corrected filename from `EnhancedReferralFrom.js`)
- Established project workflow and file conventions

### 2025-02-05 — Database Audit
- Ran 7 SQL queries against Supabase to audit both referral tables
- Populated `DATABASE.md` with complete schema for all 7 public tables
- Discovered critical schema mismatches in old dashboard:
  - `referral_inquiries` has NO `priority` column (old dashboard incorrectly referenced it)
  - `referral_inquiries` has NO `referral_source_type` column
  - `referral_inquiries` uses `client_last_initial` (not `client_last_name`)
  - `referral_inquiries` uses `client_approximate_age` (not `client_dob`)
- Documented RLS policies, constraints, JSONB fields, categorical values

### 2025-02-05 — Full Dashboard Rebuild (Sprints 1 & 2 Complete)
**Complete rewrite of `ReferralDashboard.tsx` (~1,263 lines)**

#### Design System
- Norre Framer template aesthetic: pill-shaped elements (100px border-radius), generous whitespace, ultra-minimal
- Monarch brand palette: Ash, Gunmetal, Moonstone, Champagne, Tangerine, Coconut
- Montserrat font loaded via Google Fonts injection
- Semantic color mapping for all states (hover, selected, active, muted)

#### Phase 1 — Foundation
- Design system constants (COLORS, RADIUS, SHADOWS, FONT)
- Full TypeScript interfaces: `ReferralSubmission` (61 cols), `ReferralInquiry` (17 cols)
- Dual Supabase data fetching for both tables on mount
- Badge components: PriorityBadge, UrgentBadge, TypeBadge, StatusBadge, RiskIndicator
- TabBar with pill tabs showing record counts

#### Phase 2 — Data Tables
- Tabbed view: "Referral Submissions" and "Inquiries" tabs with per-tab state
- Submissions table: 10 columns (checkbox, client name, priority, source, type, court, urgent, date, status, actions)
- Inquiries table: 8 columns (checkbox, contact, type, client, location, date, status, actions)
- Gunmetal header rows with Moonstone sort indicators
- Coconut zebra striping, Champagne selected-row highlighting
- Per-tab filtering: 4 submission filters (priority, source type, status, urgent), 2 inquiry filters (type, status)
- Per-tab sorting preserved on tab switch
- Global search (resets on tab switch since columns differ)
- Multi-select checkboxes for bulk export

#### Phase 3 — Detail Modals
- **SubmissionDetailModal** — 13 sections:
  1. Header (Gunmetal bg, name, ID, priority/urgent/status badges)
  2. Client Demographics (name, preferred name, DOB, gender, SSN masked, language, interpreter)
  3. Referral Source (name, org, title, email, phone, type badge)
  4. Legal/Court (case#, jurisdiction, judge, attorney, charges, eval date, court date)
  5. Location/Facility (type, facility, inmate ID, contact person/phone)
  6. Emergency Contact (name, relationship, phone)
  7. Risk Assessment (4-column grid of risk indicator cards + safety notes)
  8. Clinical/Medical (5 NotesBlocks: diagnoses, medications, psych history, substance use, medical conditions)
  9. Insurance (medicaid status/ID/MCO, expected payer)
  10. Additional Notes
  11. Review History (reviewed by, at, notes)
  12. Audit Trail (collapsible — IP, user agent, completion %, time spent, session ID)
  13. Footer (status update, print/PDF, export text, close — pill buttons)
- **InquiryDetailModal** — 5 sections:
  1. Header (Gunmetal bg, contact name, ID, status badge)
  2. Contact Information (name, phone, email, relationship, org, title)
  3. Client Information (first name, last initial, approx age, location)
  4. Inquiry Details (type, situation notes, how heard about us)
  5. Footer (status update, close)

#### Phase 4 — Actions & Export
- StatusDropdown (pill-shaped select) in table rows and modal footers
- Optimistic status updates to Supabase with rollback on error
- CSV export: all columns for Ritten.io EMR import (54 submission cols, 17 inquiry cols)
- "Export Selected" (checked rows) and "Export All" (filtered rows) options
- PDF export: Monarch-branded print layout via window.open with Montserrat styling
- Text export: plain text .txt download with formatted field labels

#### Phase 5 — Polish
- Loading state with Moonstone spinner
- Error state with retry button
- Empty state messaging per tab
- Row hover transitions (→ Coconut background)
- Backdrop click-to-close on modals
- Smooth transitions on interactive elements

### 2026-02-06 — Dashboard Auth Gate + Stat Cards

#### Supabase Auth Integration
- Built auth gate directly into `ReferralDashboard.tsx` (no separate component needed)
- Domain restriction: only `@monarchcompetency.com` accounts can access dashboard
- `isAllowedDomain()` helper validates email domain on every session check
- `validateAndSetSession()` auto-signs-out unauthorized domains with clear error message
- Google OAuth with `hd: monarchcompetency.com` Workspace hint to pre-filter account picker
- Magic Link with client-side domain pre-validation before OTP send
- Sign Out button in dashboard header
- Dashboard redirect URL: `https://monarchcompetency.framer.website/dashboard`
- Data fetching now gated behind `authStatus === "authenticated"` (no anonymous queries)

#### Login Screen (Norre Aesthetic)
- Checking state: centered Moonstone spinner with "Verifying session..." text
- Login card: white card on Coconut background, Gunmetal "M" brand icon
- Google OAuth button (pill-shaped, with Google SVG icon)
- "Continue with Email" → Magic Link flow with email input
- "Check your email" confirmation with green success state
- Error banner (Tangerine) for auth failures and domain rejections
- Footer: "Access restricted to @monarchcompetency.com accounts"

#### Dashboard Header Update
- Removed conditional green/orange auth status pill
- Added user email display in green pill badge
- Added "Sign Out" pill button

#### Stat Cards
- 5 summary cards above the table: Total Referrals, Pending Review, Urgent, Accepted, This Week
- Computed from live data via `useMemo` (no extra queries)
- Each card shows count + percentage pill badge
- Color-coded: Moonstone (total), Champagne (pending), Tangerine (urgent), Green (accepted), Coconut (this week)
- 5-column grid layout with Norre card styling (20px radius, card shadow)

#### Status Update Cleanup
- Removed redundant pre-update session check (dashboard is now auth-gated)
- Status updates retain optimistic update + rollback pattern

**File size**: ~1,507 lines (up from ~1,264)

### 2026-02-06 — Sprint 4 Quick Wins (Welcome Greeting + Public Form Restyle)

#### Dashboard Welcome Greeting
- Added `userName` state variable extracted from Google OAuth `user_metadata` (full_name → name → email prefix fallback)
- Dashboard header title now shows "Welcome, {firstName}" when authenticated
- First name parsed via `.split(" ")[0]` from full name

#### PublicInquiryForm.tsx Restyle (~522 lines)
- Complete visual overhaul from generic blue/slate to Monarch/Norre design system
- All form logic and database fields preserved — styling only
- Added Monarch design system constants (COLORS, RADIUS, SHADOWS, FONT) matching dashboard
- Montserrat font injection via `useEffect` (Google Fonts link element)
- Added `StepIndicator` component with Moonstone progress bar segments
- Pill-shaped navigation buttons (Back / Next / Submit)
- Moonstone primary accent color throughout
- Tangerine required field indicators (asterisks)
- 2-column grid layouts for phone/email and org/title field pairs
- Hover effects on self/other selection cards (Moonstone border + shadow lift)
- Secure referral callout restyled with Moonstone light background
- Success/error states using Monarch green/tangerine colors
- Shared style objects: `labelStyle`, `inputStyle`, `selectBaseStyle`, `textareaStyle`, `fieldGroupStyle`, `pillBtnBase`
- TypeScript types added to event handlers

### 2026-02-06 — Sprint 4 Archiving & Form Polish

#### PublicInquiryForm Updates
- Removed embedded header ("Connect With Monarch / We're here to help...") — header built in Framer instead
- Updated secure form link from `/secure-referral` to `/submit-referrals#secure-referral`

#### Dashboard Archiving System (`ReferralDashboard.tsx`)
- **Soft-delete pattern**: Records archived via `archived_at` timestamp, never permanently deleted
- **New state**: `showArchived` toggle, `archiveConfirm` confirmation modal, `archiving` loading state
- **Active/Archived filtering**: `activeSubmissions`, `activeInquiries`, `archivedSubmissions`, `archivedInquiries` computed via `useMemo`
- **Stat cards**: Now count only active (non-archived) records
- **Tab counts**: Show active record counts, not total
- **Archive toggle button**: In toolbar — switches between active and archived views, shows archived count badge
- **Batch archive**: Select multiple records via checkboxes → "Archive (N)" / "Unarchive (N)" button in toolbar
- **Single archive**: ✕ button per row in active view, ↩ button per row in archived view
- **Modal archive**: Archive/Unarchive button in both SubmissionDetailModal and InquiryDetailModal footers
- **Confirmation modal**: Branded modal with emoji icon, record count, explanatory text, Cancel/Confirm buttons
- **Archived banner**: Champagne-colored banner above table when viewing archived records
- **Empty state**: Contextual — "No archived submissions" vs "No referral submissions found"
- **Selection clearing**: Selections reset on tab change and archive toggle switch

#### Auto-Archive SQL (`Code/Database/auto-archive.sql`)
- `ALTER TABLE` statements to add `archived_at` column to both tables
- `auto_archive_old_referrals()` PL/pgSQL function: archives records older than 30 days (skips `under_review` status)
- `pg_cron` schedule template (daily at 3 AM UTC, requires Pro plan)
- Commented-out helper queries for manual testing, viewing, and unscheduling

**File size**: ~1,635 lines (up from ~1,507)

### 2026-02-08 — Sprint 5: Revised Professional Referral Form

**Major expansion of the referral system based on the Revised Professional Referral Form document.** Form expanded from 10 steps (0–9) to 14 steps (0–13) with ~45 new database columns, 3 type changes, document upload system, and referral code system.

#### Database Migration (`Code/Database/revised-form-migration.sql`)
- ~45 new columns added to `referral_submissions` via `ALTER TABLE ADD COLUMN IF NOT EXISTS`
- 3 boolean → text type changes (`suicide_risk`, `violence_risk`, `elopement_risk`) with data-preserving CASE expressions
- `referral_code` column with UNIQUE index for post-submission document uploads
- `generate_referral_code()` PL/pgSQL function (generates `MON-XXXX` codes, collision-safe)
- `auto_set_referral_code()` trigger function + `trg_auto_referral_code` BEFORE INSERT trigger
- Supabase Storage setup instructions (private `referral-documents` bucket with RLS policies)
- Verification queries for column audit and type checking

#### ReferralForm.tsx — Complete Rewrite (~2,560 lines)
**14-step secure professional referral form** (expanded from 10 steps):
- **Step 0**: Source type selection — 8 cards (added `other_professional`). Family/self branch KEPT as-is (unchanged simplified 6-field form)
- **Step 1**: Referral source info — name, org, title, phone, email, collateral info, previous referral, urgent placement checkbox. Callout about collateral/ROIs
- **Step 2**: Additional contacts — emergency contact + JSONB additional professional contacts with "Add Another Contact" pattern
- **Step 3**: Demographics — 16 fields (legal names, DOB, gender, sex at birth, pronouns, language, English proficiency, interpreter, ethnicity, marital status, SSN optional, phone, email, consent)
- **Step 4**: Documents & identification — multi-select checkboxes (13 document types) with "none available" toggle logic, upload placeholder, notes
- **Step 5**: Insurance & benefits — Medicaid/Medicare/Private insurance sections with conditional fields, SSI/SSDI status, benefits notes
- **Step 6**: Legal status & court — 23+ fields across court, competency status (CRITICAL), legal representation, supervision (probation/parole), bond status, PR bond notification sections
- **Step 7**: Current location — location type, facility details, incarceration status, expected release, housing history
- **Step 8**: Mental health & clinical — diagnoses, medication compliance, current meds, barriers, psych history, treatment programs, TBI/IDD subsections
- **Step 9**: Substance use — pattern enum (8 options), current use, history, detox required, detox details
- **Step 10**: Medical & somatic — conditions, controlled status, non-psychiatric meds, allergies, mobility, ADL support, acute needs
- **Step 11**: Safety & risk — risk timeframe enums (current/recent/recovering/historical/no history) for suicide/violence/elopement + detail fields, arson/RSO flags
- **Step 12**: Urgency & notes — urgency level enum, reason, additional notes, referral channel
- **Step 13**: Review & submit — all sections with edit buttons, confirmation checkbox

**Key implementation patterns:**
- `renderField()` helper handles text/select/textarea/tel/email/date types (DRY)
- `renderCheckbox()`, `renderNav()`, `renderReviewLine()`, `renderEditButton()` helpers
- `handleDocToggle()` for multi-select document checkboxes with "none_available" logic
- `addContact()`, `updateContact()`, `removeContact()` for JSONB additional contacts
- `submittedReferralCode` state for success screen display with referral code
- Geometric/minimal design system (0px border-radius, flat borders)
- No required field validation during dev/testing (all fields optional)
- Responsive design with `isMobile` state + window resize listener

#### DocumentUploadForm.tsx — New File (~500 lines)
**Standalone Framer code component** for `/submit-referrals/documents`:
- 3-step flow: verify (code + email) → upload files → success
- URL parameter pre-fill (`?code=MON-A4K7`)
- Supabase verification against `referral_submissions` (matches `referral_code` + `referral_source_email`)
- Minimal referral summary display (client initials + DOB only — no PHI)
- Multi-file upload to Supabase Storage with type/size validation (PDF, JPG, PNG, DOC, DOCX; max 10MB per file)
- File path: `referrals/{referral_id}/{timestamp}_{filename}`
- Merges new uploads with existing `uploaded_documents` jsonb array
- Matching geometric/minimal design system

#### ReferralDashboard.tsx — Dashboard Updates (~2,037 lines)
**Updated admin dashboard to display and export all new fields:**

**Type/Interface updates:**
- Added `other_professional` to `ReferralSourceType` union
- Expanded `ReferralSubmission` interface from ~63 to ~130+ fields
- Risk fields changed from `boolean` to `string` type

**New label maps:**
- `COMPETENCY_STATUS_LABELS` (7 values)
- `URGENCY_LABELS` (4 values)
- `RISK_TIMEFRAME_LABELS` (5 values with timeframe descriptions)
- Updated `LOCATION_LABELS` with new location types

**RiskIndicator component rewritten:**
- Supports both `active` (boolean, for `medical_needs`) and `value` (text enum, for risk timeframes)
- Displays timeframe label instead of YES/NO for risk fields

**Modal detail sections expanded** from 7 to 12+ sections:
- Client Demographics (15 fields)
- Referral Source (8 fields + referral code in header)
- Contacts (emergency + JSONB additional contacts)
- Documents (available docs, notes, uploaded files listing)
- Legal / Court (12+ fields + supervision/bond subsection)
- Current Location / Facility (10+ fields + housing)
- Risk Assessment (4 indicators with timeframe enums + arson/RSO)
- Mental Health & Clinical (diagnoses, compliance, meds, barriers, TBI, IDD)
- Substance Use (pattern, current, history, detox)
- Medical / Somatic (conditions, meds, allergies, mobility, ADL, acute)
- Insurance / Benefits (Medicaid, Medicare, private, SSI/SSDI)
- Urgency & Notes (level, reason, channel, additional notes)

**Export updates:**
- CSV export expanded from ~52 to ~95+ columns
- PDF export rewritten with all new sections (competency status, housing, TBI/IDD, substance patterns, etc.)
- Text export rewritten with comprehensive field coverage
- Search updated to include `referral_code`, `attorney_name`, `competency_status`, `facility_name`

#### Documentation Updates
- `DATABASE.md` — Complete rewrite documenting ~105 columns, JSONB structures, referral code system, Supabase Storage setup, categorical values, type changes, functions/triggers
- `PROJECT.md` — This changelog entry

---

## TODO / Roadmap

### Sprint 1 — Foundation & Export ✅ COMPLETE
- [x] Audit database schema (both tables)
- [x] Expand TypeScript interfaces to cover all database fields
- [x] Wire dashboard to query both `referral_inquiries` and `referral_submissions`
- [x] Implement CSV export (bulk + individual) for Ritten.io integration
- [x] Implement PDF export (printable referral summary)
- [x] Implement text/plain export

### Sprint 2 — Workflow & Status Management ✅ COMPLETE
- [x] Design status workflow (pending → under_review → accepted → declined → waitlisted)
- [x] Implement status update functionality in dashboard + modal
- [x] Add status filter to dashboard
- [x] Add search/text filter across all fields

### Sprint 3 — Auth & Dashboard UX ✅ COMPLETE
- [x] Supabase Auth gate on dashboard (Google OAuth + Magic Link)
- [x] Domain restriction (@monarchcompetency.com only)
- [x] Branded login screen (Norre aesthetic)
- [x] User email display + Sign Out in dashboard header
- [x] Stat cards (Total, Pending, Urgent, Accepted, This Week)
- [x] Data fetching gated behind authentication

### Sprint 4 — Dashboard Polish & Public Form ✅ COMPLETE
- [x] Sign Out function (dashboard) — built into auth gate
- [x] Welcome with authenticated user's name in dashboard
- [x] Update `PublicInquiryForm.tsx` to match website styling and Monarch color theme
- [x] Insert `PublicInquiryForm.tsx` into homepage (pasted into Framer)
- [x] Remove PublicInquiryForm header (header built in Framer instead)
- [x] Update secure referral link to `/submit-referrals#secure-referral`
- [x] Form archiving/delete functions + batch archiving (soft-delete with `archived_at`)
- [x] Auto-archive referrals after 30 days (SQL function + pg_cron template)

### Sprint 5 — Revised Professional Referral Form ✅ COMPLETE
- [x] Analyze revised referral form document (RTF) and create implementation plan
- [x] Create database migration SQL (`revised-form-migration.sql`) — ~45 new columns, 3 type changes
- [x] Rebuild `ReferralForm.tsx` — 14-step form with all new fields, conditional logic, JSONB contacts
- [x] Create `DocumentUploadForm.tsx` — post-submission document upload page with referral code verification
- [x] Update `ReferralDashboard.tsx` — dashboard with all new fields, exports, modal sections
- [x] Update `DATABASE.md` — full schema documentation (~105 columns)
- [x] Update `PROJECT.md` — this changelog entry

### Sprint 5 — Deployment Steps (Manual)
- [ ] Run `revised-form-migration.sql` in Supabase SQL Editor
- [ ] Create `referral-documents` private bucket in Supabase Storage dashboard
- [ ] Add RLS policies to storage bucket (see DATABASE.md)
- [ ] Paste updated `ReferralForm.tsx` into Framer
- [ ] Paste `DocumentUploadForm.tsx` into Framer (new page at `/submit-referrals/documents`)
- [ ] Paste updated `ReferralDashboard.tsx` into Framer
- [ ] Test family/self branch still works unchanged
- [ ] Test professional path through all 14 steps
- [ ] Test referral code generation on submission
- [ ] Test document upload flow (code + email → upload)
- [ ] Test dashboard modal with new fields
- [ ] Test PDF/Text/CSV exports with new columns
- [ ] Add required field validation (currently all optional for dev/testing)

### Sprint 6 — Security Hardening
- [ ] Enable RLS on all tables + verify status updates work with auth
- [ ] Row Level Security policy hardening in Supabase
- [ ] Audit logging for PHI access
- [ ] Session timeout handling
- [ ] Role-based access control (leverage existing `tenant_roles` / `role_permissions` tables)

### Sprint 7 — Notifications & User Settings
- [ ] User settings/preferences (lightweight — notification settings/methods)
- [ ] Email notifications on new referral submissions (Supabase Edge Functions or BuildShip)
- [ ] Real-time subscriptions for new referral notifications in dashboard
- [ ] Batch status updates

### Future
- [ ] Ritten.io direct API integration (if API available)
- [ ] Dashboard analytics/metrics (charts, trends)
- [ ] Confirmation email sent to referral source with referral code + upload link
