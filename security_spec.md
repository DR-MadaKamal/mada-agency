# Firebase Security Specification - Kiyla Ultimate

## Data Invariants
1. Only authorized administrators can read or write to `integrations`.
2. API Logs can only be written by the system (authenticated users) and read by administrators.
3. Administrator status is determined by the presence of a document in the `admins` collection with the user's UID.

## The Dirty Dozen Payloads (Targeting Integrations)
1. **Unauthenticated Write**: `{ "name": "Fake API", "provider": "custom", "status": "active" }` (No Auth) -> DENIED
2. **Standard User Read**: Authenticated user trying to list `/integrations` -> DENIED
3. **Admin Discovery**: Unauthenticated user trying to check if `/admins/someUid` exists -> DENIED
4. **Integration Poisoning**: Admin trying to update `id` field -> DENIED (Immutable)
5. **Log Forgery**: Standard user trying to write an `ApiLog` with an admin's `userId` -> DENIED
6. **Shadow Fields**: Admin adding `extra_field: "hacked"` to an integration -> DENIED (Strict Schema)
7. **Role Escalation**: Standard user trying to create a document in `/admins` for themselves -> DENIED
8. **PII Leak**: Standard user trying to read `/admins` collection -> DENIED
9. **Endpoint Injection**: Admin providing a 2MB string for the `endpoint` -> DENIED (Size constraint)
10. **Status Shortcut**: Standard user trying to delete an integration -> DENIED
11. **Spoofed Admin**: Authenticated user with email `madakamal16491@gmail.com` but `email_verified: false` -> DENIED
12. **Recursive Attack**: Standard user attempting O(n) list query on logs without filters -> DENIED

## Test Plan
- Verify `isSignedIn()`
- Verify `isAdmin()` checks `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`
- Verify `isValidIntegration()` enforces key size and types.
