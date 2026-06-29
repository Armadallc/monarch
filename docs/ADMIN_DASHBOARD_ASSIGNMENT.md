# Admin dashboard: assignment model (to decide)

**Status:** Not yet implemented. Documented for when we start testing and deciding.

## Options

1. **All staff see the same dashboard (current)**  
   Every `@monarchcompetency.com` user sees all referrals. No per-user assignment.

2. **Referrals assignable to specific staff**  
   Referrals can be assigned to specific `@monarchcompetency.com` users. All staff still see the same dashboard by default, but can filter by **“Assigned to me”** to show only referrals assigned to them.

## To decide

- Keep dashboard open for all staff with no assignment, **or**
- Add an **assigned_to** (or similar) field and “Assigned to me” filter so staff can optionally work from a personal queue while still having access to the full list.

Once decided, we can add the column, RLS (if needed), and the filter UI in the admin dashboard.
