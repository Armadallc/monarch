# Restore ReferralSourcePortal in Framer

The Framer code component **ReferralSourcePortal.tsx** (used on `/portal`) was truncated and only has lines 1–93 (inlined design system + supabase client). The rest (StatusBadge, ReferralDetailModal, export default ReferralSourcePortal, etc.) is missing.

## Fix

1. Open **Code/Framer/ReferralSourcePortal.tsx** in this repo (it has the full component with inlined design system).
2. Select **all** (Cmd+A / Ctrl+A) and **copy**.
3. In Framer: **Code** → open **ReferralSourcePortal.tsx**.
4. Select **all** in the Framer editor and **paste** (replace everything).
5. **Save** in Framer, then try **Publish** again.

The local file is the single source of truth; it has no `../DesignSystem` import, so publish will succeed.
