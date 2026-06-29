# Referral lifecycle, admissions closure, and portal visibility (working notes)

This document captures **product and compliance directions** discussed when shipping **portal access opt-in** on the referral form. It is **not** a implemented spec until engineering and legal sign off.

## Portal opt-in vs. referral visibility

- **Opt-in (Y/N)** controls **post-submit session behavior** (redirect to portal vs. sign out to public site after timeout) and persists a **default** on `referral_source_profiles.portal_access_preferred`.
- **Past referrals** submitted under the same authenticated account remain **visible in the portal** when the source later opts **Yes**; status mirrors the **admissions dashboard** (`referral_submissions.status` and related workflow).
- Some referrals may **no longer be “active”** from a business perspective (accepted then admitted elsewhere, declined, etc.) even though they still appear in the list with their **terminal or in-progress status**.

## Admissions: definitive “closed” vs. in-queue (future work)

Not implemented in the portal-access migration; design when intake workflow matures.

| Concept | Intent (draft) |
|---------|----------------|
| **Admitted** | Referred client is physically on site / in program; referral row may be **closed** from a referring-source perspective (no new intake info expected through this referral channel). |
| **Waitlisted** | Not closed; **in line** until status changes. |
| **Declined (with reason)** | **Closed**; no longer active for operational follow-up through this referral. |

**Dashboard** will need explicit transitions and possibly new status values or a separate **closure** / **lifecycle phase** column so the portal can show “closed” vs. “active queue” clearly without overloading a single `status` enum.

## HIPAA / referring sources after admit

- After **accept / admit**, clinical identity moves to **EMR (MRN)**; referral sources **do not** receive EMR access through the portal.
- **Legal review** is still required for what minimal referral metadata may remain visible to sources after closure (e.g. status-only vs. historical PHI). Document conclusions in privacy policy and portal copy once counsel approves.

## Related migrations and app

- `20260524120000_portal_access_opt_in.sql` — `referral_submissions.portal_access_opt_in`, `referral_source_profiles.portal_access_preferred`.
- Referral form: `Code/Framer/ReferralForm.tsx` (Framer duplicate under `Code/Framer/` when synced).

---

*Legal and clinical teams should refine retention and portal visibility rules before tightening RLS or hiding rows by lifecycle.*
