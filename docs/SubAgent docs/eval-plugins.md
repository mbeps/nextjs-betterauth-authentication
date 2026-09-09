# Skill Evaluation: Plugin Files

> Evaluated against: `lib/auth/auth.ts`, `lib/auth/auth-client.ts`, `lib/auth/roles.ts`, `app/admin/page.tsx`, `app/organizations/page.tsx`, and `docs/SubAgent docs/better-auth-docs.md`  
> Date: 2026-08-11

---

## 1. `passkeys.md`

### Import Path
**PASS.** Skill correctly uses `@better-auth/passkey` (server) and `@better-auth/passkey/client` (client). Warns against the old `better-auth/plugins/passkey` path. Matches both `auth.ts` and the official docs.

### `authClient.passkey.addPasskey()`
**PASS.** Correct method name. Confirmed by docs: `await authClient.passkey.addPasskey({ name: "..." })` → `POST /passkey/add-passkey`.

### `authClient.passkey.deletePasskey()`
**PASS.** Correct method name. Confirmed by docs: `await authClient.passkey.deletePasskey({ id: "..." })` → `POST /passkey/delete-passkey`. Not `delete()`.

### `authClient.signIn.passkey({ autoFill: true })`
**PASS.** Correct signature. Confirmed by docs and used in the skill's `PasskeyButton` pattern.

### `autoComplete="email webauthn"`
**MINOR INACCURACY.** The skill uses `autoComplete="email webauthn"` but the official docs say `autocomplete="username webauthn"`. The WebAuthn spec uses `"username"` as the canonical token for passkey autofill; `"email"` works in practice but is not the spec-recommended token. The codebase follows the skill (email), so this is a low-risk divergence from docs.

### Overall: PASS with 1 minor note.

---

## 2. `session-management.md`

### `auth.api.listSessions()` vs `auth.api.listUserSessions()`
**PASS.** `auth.api.listSessions()` is correct for listing the authenticated user's own sessions. `listUserSessions` is an admin plugin method (`authClient.admin.listUserSessions({ userId })`). No confusion in the skill.

### `authClient.revokeSession({ token })`
**PASS.** Correct — uses `token` not `id`. Confirmed by docs: `await authClient.revokeSession({ token: "session-token" })`. The skill's example (`{ token: session.token }`) is accurate.

### `nextCookies` placement — "MUST be last plugin"
**CRITICAL INACCURACY.** The skill states:
```
nextCookies(), // MUST be last plugin
```
The **actual codebase** (`lib/auth/auth.ts`) places `nextCookies()` as the **first** plugin, not last:
```typescript
plugins: [
  nextCookies(),  // ← FIRST
  twoFactor(),
  passkey(),
  adminPlugin({...}),
  organization({...}),
]
```
The compiled official docs (2026-08-11) make **no mention of an ordering requirement** for `nextCookies`. The codebase functions correctly with it first. The "MUST be last" claim is either a legacy requirement from older Better Auth versions no longer enforced, or was never a hard requirement. As written, the skill contradicts the actual working codebase.

**Action needed:** Remove or soften the "MUST be last" claim, or add a note that placement at first position also works.

### Cookie cache `maxAge`
**PASS (skill is correct; evaluation question's assumption is outdated).** The skill documents `maxAge: 60 * 60 * 24 * 7` (7 days) which matches `auth.ts` exactly. The `.github/copilot-instructions.md` attachment references an old value of 60 seconds that no longer reflects the codebase. The skill is current.

### Overall: 1 CRITICAL issue (`nextCookies` ordering claim).

---

## 3. `organizations.md`

### `authClient.organization.list()` vs `authClient.organization.listOrganizations()`
**PASS.** Correct method is `organization.list()`. Confirmed by docs: `await authClient.organization.list()` → `GET /organization/list`. There is no `listOrganizations()` method.

### `authClient.organization.setActive()` vs `authClient.organization.setActiveOrganization()`
**PASS.** Correct method is `organization.setActive({ organizationId })`. Confirmed by docs: `await authClient.organization.setActive({ organizationId: "org-id" })` → `POST /organization/set-active`. There is no `setActiveOrganization()` method.

### Invite acceptance flow
**PASS.** Flow is accurate:
- `authClient.organization.acceptInvitation({ invitationId })` ✓  
- `authClient.organization.rejectInvitation({ invitationId })` ✓  
- `auth.api.getInvitation(...)` for server-side invitation fetch ✓  
- Post-accept `setActive` + redirect ✓  

### Organization role names
**PASS.** Skill uses `"owner"`, `"admin"`, `"member"` throughout. Matches `ORG_ROLES` in `lib/auth/roles.ts` and the official docs.

### Overall: PASS — no issues found.

---

## 4. `admin.md`

### `authClient.admin.listUsers()`
**PASS.** Correct method. Confirmed by docs: `await authClient.admin.listUsers({ query: {...} })`. Server-side cast pattern (`adminApi.listUsers(...)`) matches `app/admin/page.tsx` exactly.

### `authClient.admin.impersonateUser({ userId })`
**PASS.** Correct method and parameter. Confirmed by docs: `await authClient.admin.impersonateUser({ userId: "user-id" })`.

### `authClient.admin.stopImpersonating()`
**PASS.** Correct method name. Confirmed by docs. Not `stopImpersonation()` or similar.

### `authClient.admin.banUser()` vs `authClient.admin.ban()`
**PASS.** Correct method is `banUser()`. Confirmed by docs: `await authClient.admin.banUser({...})`. There is no `.ban()` shorthand.

### `userHasPermission` — server-side availability
**PASS.** Available as `adminApi.userHasPermission({ headers, body: { permissions } })`. Confirmed by both docs and the actual `app/admin/page.tsx`:
```typescript
const hasAccess = await adminApi.userHasPermission({
  headers: await headers(),
  body: { permissions: { user: ["list"] } },
});
```

### Overall: PASS — no issues found.

---

## Cross-File Consistency

### Impersonation coverage
**CONSISTENT.** Both files agree on `authClient.admin.impersonateUser({ userId })` and `authClient.admin.stopImpersonating()`. The `ImpersonationIndicator` component pattern in `admin.md` aligns with the session check described in `session-management.md §10`.

### Organization role names
**CONSISTENT.** `organizations.md` uses `"owner"`, `"admin"`, `"member"`. `admin.md` uses global roles `"admin"` / `"user"` — distinct from org roles, correctly separated. No confusion.

---

## Summary

| File                    | Status   | Critical Issues                                                                            |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `passkeys.md`           | PASS     | — (1 minor: `"email webauthn"` vs spec-canonical `"username webauthn"`)                    |
| `session-management.md` | **FAIL** | `nextCookies` "MUST be last" contradicts the codebase (it's first) and is absent from docs |
| `organizations.md`      | PASS     | —                                                                                          |
| `admin.md`              | PASS     | —                                                                                          |

## Critical Issues for Immediate Fix

1. **`session-management.md` §2** — Remove the `// MUST be last plugin` assertion from the `nextCookies()` code sample. The actual `auth.ts` places it first, the docs impose no ordering constraint, and the claim will mislead developers into reordering a working plugin array.
