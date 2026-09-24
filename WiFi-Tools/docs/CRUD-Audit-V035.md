# CRUD / Referential Integrity Audit — V035

## Fixed in V035

1. Site Allow Package cannot remove a Package while an Account of that Package is dispatched to the Site.
2. Account `check()` / `serialize()` strictly validate Package and Dispatch Site relations.
3. Legacy stale dispatch relations are recovered fail-closed by setting the Account to Inactive and clearing only the invalid dispatch relation.
4. Portal Path edit/delete/binding changes reconcile Site coverage immediately.
5. Account CSV export protects formula-leading cells.

## Still intentionally not Full CRUD

- Account: no Delete / direct Package reassignment yet.
- Administrator: no Delete (Disable is available).
- Walled Garden / Bypass MAC: no Edit.
- Notification channels: no Delete/reset action.
- Coupon: no Update/Delete.
- Report Schedule: no Delete.

These are capability gaps, not silent CRUD failures.
