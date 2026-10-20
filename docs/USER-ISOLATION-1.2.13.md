# Ejazati 1.2.13 — app-specific user membership

## Problem
The shared Auth `on_auth_user_created_ejazati` trigger provisioned Ejazati profiles for every new project account, including Spot signups. Owner profile policies then exposed all of those stubs. Inspection confirmed one evidenced Ejazati owner and four Spot-origin accounts without Ejazati leave activity.

## Prepared fix
- Store authoritative membership in a private, RLS-enabled table with no client table grants.
- Backfill accounts evidenced by existing Ejazati ownership or real app data; retain all existing profile stubs and shared Auth identities.
- Require membership for profile SELECT/UPDATE, active/owner checks and yearly scheduled processing.
- Record membership only on authenticated entry to Ejazati through a caller-only, idempotent RPC; preserve existing disabled status and roles.
- Restrict signup provisioning to explicit Ejazati signup. The metadata marker only reserves display/username fields; it never grants membership or privilege.
- Ensure the frontend joins before requesting any profiles or app data, with retry/error handling.
- Bump asset/cache version to 1.2.13; preserve the prior repairs.

## Validation status
- Passed: 26 Node tests, including the complete HTML/patch script chain, authentication callback lock discipline, ordered enrollment and rejection/retry behavior.
- Passed: Wrangler deployment dry run.
- Passed against the shared Supabase project: `tests/database-membership.sql` tests the actual shared signup triggers, owner visibility, denial of foreign profile updates, metadata spoofing, idempotent self-enrollment, own-account RLS, self-promotion prevention, disabled-account and missing-authentication rejection. All writes are inside a rollback transaction.
- Applied transactionally through the Supabase SQL Editor after user-authorized browser fallback. Migration history records `20261020023043_isolate_ejazati_membership`. The stored SQL matches the repository migration.
- Verified: one evidenced Ejazati member is visible; all five original profile records and four leave records remain. No anonymous RPC access or client access to the private membership table.
- Frontend release: 1.2.13 beta; production deployment remains subject to owner approval.
- Security advisors reviewed: membership table deliberately has no client policy/grant; enrollment is a caller-only authenticated SECURITY DEFINER RPC with a fixed search path and explicit disabled-account check. Existing username availability is intentionally public and returns only a boolean. Other apps’ findings are outside this change.

The change does not alter other apps' profile tables, passwords, shared Auth accounts or real leave records. An account becomes an Ejazati member when it actually enters Ejazati, even if it also uses another app.
