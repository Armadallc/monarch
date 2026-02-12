# Planning: Timeline, Portal, and Dashboard

## Current state

- **Built:** Public site (Framer), Public Inquiry form, Secure Referral form (OAuth), Document Upload (code + email), **Admin Dashboard** (staff, @monarchcompetency.com).
- **Not built:** **Referral Source Portal** — the authenticated experience for professional referrers to see and track their own referrals.

## Goals

1. **Timeline for both sides**  
   When staff update a referral’s status in the **Admin Dashboard**, that step is recorded (e.g. `referral_status_history`). The same data drives:
   - **Dashboard:** Timeline (or status history) per referral for staff.
   - **Referral Source Portal:** Timeline per referral so the referrer sees progress (e.g. Submitted → Under review → Decision).
   - Referrals can take a couple days to get a response; the timeline makes progress visible to both staff and referrers.

2. **Referral Source Portal**  
   - Professional referrers access it from the website (post–Google OAuth).
   - They see only their submissions; they can track status, upload documents, (later) use share links and messaging.
   - Full spec: `docs/REFERRAL_SOURCE_PORTAL.md`.

3. **User preferences (portal)**  
   - Basic panel in the portal (e.g. My Profile): how to receive notifications, toggles on/off (email for status changes, new messages, ROI signed, document uploads, weekly summary).
   - Stored in a profile table (e.g. `referral_source_profiles`) and respected by notification logic.

4. **Questions from referral sources**  
   - Referrers can **call directly** today.
   - **Asking a question through the portal** (e.g. per-referral Q&A) is **to be planned later**. For now we focus on context, timeline, and preferences.

## Implementation order (high level)

1. **Context and schema**  
   - Document timeline + portal + preferences (this doc + `REFERRAL_SOURCE_PORTAL.md`).
   - Add DB: `referral_status_history` (+ trigger on status change), `referral_source_profiles`, `referral_submissions.submitted_by_user_id`, and any other tables from the portal spec.

2. **Dashboard timeline**  
   - In Admin Dashboard: when viewing a referral, show status history / timeline (from `referral_status_history`). Staff continue to update status as today; each update is logged and displayed.

3. **Portal core**  
   - Referral Source Portal: auth (existing OAuth), My Referrals list (filter by `submitted_by_user_id`), referral detail with **timeline** (same `referral_status_history`), document upload, basic profile + **notification preferences**.

4. **Notifications**  
   - Use profile preferences to send (or suppress) email for status changes, messages, ROI signed, document uploads, weekly summary.

5. **Later**  
   - Share links, collateral invites, portal messaging, and **in-portal “ask a question”** flow to be designed and implemented in a later phase.

## Local project and Framer

- **Local repo:** `package.json` and `tsconfig.json` in the repo root for TypeScript/React type-checking and editing. Code is still pasted into Framer; the repo is the source of truth.
- **Framer:** Site and code components live in Framer. To give Cursor up-to-date context from the Framer project, use the **Framer MCP** (see `docs/FRAMER_CONNECTION.md`). Do not store MCP secrets in the repo.
