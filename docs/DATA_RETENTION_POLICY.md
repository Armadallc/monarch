# Data Retention and Audit Logging Policy

**Effective date:** [Date]  
**Last reviewed:** [Date]  
**Scope:** Monarch Competency referral system (Supabase-backed application containing ePHI).

---

## 1. Purpose

This policy establishes retention requirements for protected health information (PHI) and audit logs in compliance with:

- **HIPAA** (45 CFR § 164.530(j)): documentation retained at least 6 years from creation or from when it was last in effect, whichever is later.
- **Colorado law:** mental health records (10 years), substance use disorder records (10 years), adult medical records (10 years after last treatment), 6 CCR 1011-1 and Colorado Mental Health Practice Act.

To satisfy both HIPAA and Colorado and avoid separate retention rules per record type, **Monarch applies a single retention period of 10 years for all PHI and audit data in this system.**

---

## 2. Retention period: 10 years

| Record type | Retention | Rationale |
|-------------|-----------|-----------|
| Referral submissions (ePHI) | 10 years | Colorado medical/mental health and substance use requirements; HIPAA minimum 6 years. |
| Referral status history | 10 years | Part of referral record. |
| Section notes (referral_section_notes) | 10 years | Part of clinical/referral record. |
| Messages (referral_messages) | 10 years | Part of clinical record. |
| Audit/activity log (referral_activity_log) | 10 years | HIPAA audit controls (164.312(b)) minimum 6 years; 10 years for consistency. |
| Share links (referral_share_links) | 10 years | Tied to referral; follow referral retention. |
| Section statuses (referral_section_statuses) | 10 years | Part of referral workflow record. |

**Simple rule:** Retain all referral-related data and audit logs for **10 years** from the relevant date (e.g. `created_at` for the referral or the log entry).

---

## 3. What we log (audit)

The application logs the following in `referral_activity_log` (HIPAA 164.312(b) Audit Controls):

- Referral submitted, referral viewed, status change, section note, message sent, assignment changed, section status changed, share link created/revoked.
- Per event: who (actor_user_id, actor_email), when (created_at), what (activity_type, details), outcome, and when available: user_agent, session_id, ip_address.

Logs are append-only (no UPDATE/DELETE by application users). See `docs/HIPAA_AUDIT_LOGGING.md`.

---

## 4. Enforcement of retention

- **No automatic deletion** by the application. Data is retained for at least 10 years.
- **Purge of data beyond retention** is a controlled process: run only by authorized staff (e.g. via a Supabase function or scheduled job with appropriate privileges). Destruction must be documented.
- Optional SQL helper: `purge_referrals_older_than_retention(p_years INTEGER)` (see migration `20260217120001_hipaa_retention_10yr.sql`) may be used to delete referral rows older than `p_years`; child tables are removed by cascade. Call only when retention has been reviewed and destruction is authorized.

---

## 5. Log review

- Audit logs are reviewed as needed for anomalies, suspected incidents, and during security or compliance reviews.
- Access to full audit log data is restricted (e.g. staff with appropriate access; referral sources see only activity on their own referrals per RLS).

---

## 6. Responsibilities

- **Privacy / compliance:** Define retention and approve any purge process.
- **IT / platform:** Maintain audit logging and retention tooling; run purges only when authorized and documented.
- **All staff:** Report suspected breaches or misuse.

---

## 7. Legal basis (summary)

| Requirement | Citation |
|-------------|----------|
| HIPAA documentation retention | 45 CFR § 164.530(j) — 6 years |
| HIPAA audit controls | 45 CFR § 164.312(b) |
| Colorado adult medical records | 6 CCR 1011-1, Chapter 2 — 10 years after last treatment |
| Colorado mental health records | Colorado Mental Health Practice Act — 10 years |
| Colorado substance use records | 42 CFR Part 2 + state — 10 years |

By retaining all relevant data for 10 years, Monarch meets HIPAA and Colorado requirements without maintaining separate schedules per record type.
