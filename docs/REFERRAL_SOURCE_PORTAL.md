# Referral Source Portal — Technical Specification

> Source: REFERRAL SOURCE PORTAL.txt (Monarch Competency). Full spec for the portal **not yet built**.

## Overview

**Purpose:** The Referral Source Portal gives authenticated referral sources (court coordinators, attorneys, probation officers, case managers, facility staff, etc.) a secure dashboard to:

- View all referrals they have submitted
- **Track status and progress of each referral** (timeline)
- Upload additional documents to existing referrals
- Generate shareable links for ROI signing and document uploads
- Invite collateral contacts to contribute information
- Communicate with Monarch admissions staff

**Authentication:** Google OAuth (existing). User identity from `auth.users.id`. No separate signup.

**Access control:** Referral sources see only their own referrals. RLS enforces isolation. Staff use the Admin Dashboard (separate interface).

---

## Timeline (shared with Admin Dashboard)

- **Referral detail view** includes a **STATUS TIMELINE** (e.g. Submitted → ROI Signed → Under Review → Decision → Done) with timestamps.
- As staff update status in the **Admin Dashboard**, each step is recorded (e.g. `referral_status_history` table + trigger).
- The **same status history** drives both the **portal timeline** (referral source view) and the **dashboard timeline** (admin view).
- After submission it can take a couple days to respond; the timeline shows where each referral is in the process.

---

## User preferences (My Profile)

- **My Profile** (`/portal/profile`) includes:
  - **EMAIL NOTIFICATIONS** section with toggles:
    - Referral status changes
    - New messages from Monarch admissions
    - ROI signed notifications
    - Document upload notifications
    - Weekly summary of all referrals
- Referral sources get a **basic preferences panel**: how they want to receive notifications, toggle notifications on/off. Stored in `referral_source_profiles` (or similar).

---

## Questions from referral sources

- Sources can **call directly** or (future) **ask a question through the portal**.
- How sources ask questions via the portal is to be **planned later**; for now focus on context, timeline, and preferences.

---

## Database schema changes (from spec)

| Change | Purpose |
|--------|---------|
| **referral_source_profiles** | Profile + notification preferences per user |
| **referral_submissions.submitted_by_user_id** | Link referral to auth user; RLS so sources see only their referrals |
| **referral_status_history** | One row per status change; trigger on `referral_submissions.status` update. Backbone for **timeline** in portal and dashboard |
| **referral_share_links** | Shareable links (ROI, document upload) with token |
| **referral_activity_log** | Audit trail / activity types (submitted, status_changed, document_uploaded, etc.) |
| **referral_messages** | Messaging between referral source and staff |

---

## UI (summary)

- **Nav:** Dashboard | My Referrals | New Referral | My Profile
- **Dashboard:** Welcome, stat cards (Total, Pending, Awaiting ROI, Action Needed), quick actions, recent referrals, recent activity
- **My Referrals:** List with search, filters (status, time, ROI), sort
- **Referral detail:** Header, **STATUS TIMELINE**, documents, share links, collateral contacts, messages, activity log
- **My Profile:** Account info, profile details, **EMAIL NOTIFICATIONS** toggles, download forms (ROI, Pre-Admission, etc.)
- **Share link modals:** Create link (ROI / Document upload / Collateral), invite collateral contact
- **Public share pages** (`/r/[token]`): ROI signing (token + DOB), document upload (token only) — no OAuth

---

## Implementation phases (from spec)

- **Phase 2A:** Core portal — schema, `submitted_by_user_id`, My Referrals list, referral detail (status, documents), document upload, profile (view/edit).
- **Phase 2B:** Share links and collaboration (generate links, public ROI/upload pages, collateral invites).
- **Phase 2C:** Communication and activity — activity log, **status timeline**, messaging, email notifications.
- **Phase 2D:** Polish — dashboard stats, search/filter, mobile, performance.

---

## Email templates (from spec)

Templates specified for: Collateral contact invitation, ROI signing request, Status change notification, Document uploaded notification, ROI signed notification.
