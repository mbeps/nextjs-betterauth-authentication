# Evaluation: server-client-patterns.md & email-hooks.md

**Date**: 2026-08-11  
**Reference**: `lib/auth/auth.ts`, `app/profile/page.tsx`, `app/admin/page.tsx`, `lib/auth/auth-client.ts`, `lib/emails/*`

---

## server-client-patterns.md

### Accuracy Checks

| Check                                       | Result | Notes                                                                                                                           |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `await headers()` requirement in Next.js 15 | ✅ PASS | Section 2 correctly documents `headers: await headers()`. Both `profile/page.tsx` and `admin/page.tsx` confirm this.            |
| Decision table (server vs client)           | ✅ PASS | All rows accurate and useful. OAuth/passkey correctly marked client-only.                                                       |
| Middleware config matcher format            | ✅ PASS | Standard Next.js regex negative lookahead pattern — valid.                                                                      |
| `authClient.useSession()` return type       | ✅ PASS | `{ data, isPending, error }` is correct. `data` shape `{ session, user } \| null` is accurately documented in section 7 table.  |
| RSC vs Client Components explanation        | ✅ PASS | Decision guide (section 4) and two-config pattern (section 1) are clear and correct.                                            |
| App Router compatibility                    | ✅ PASS | No patterns that break App Router. Server Component + `redirect()` pattern matches actual pages.                                |
| Protected page pattern                      | ✅ PASS | Section 5 is an exact structural match with `app/profile/page.tsx` (`auth.api.getSession` → null check → redirect → user cast). |
| Admin permission-gated pattern              | ✅ PASS | Section 5 admin example matches `app/admin/page.tsx` exactly, including `userHasPermission` check before `listUsers`.           |
| Two-config sync (server ↔ client plugins)   | ✅ PASS | Section 1 plugin lists match `auth.ts` and `auth-client.ts` exactly, including `adminClient` receiving `ac, roles`.             |

### Issues

**[MINOR] Section 10 — Type exports not present in codebase**  
The skill recommends:
```typescript
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```
The actual `lib/auth/auth.ts` does not export these types. The suggestion is valid Better Auth practice but it's a recommended pattern, not a description of what exists. Consider adding a note that these are optional additions.

**[UNVERIFIABLE] Middleware cookie name**  
Section 8 states the cookie is `better-auth.session_token`. No `middleware.ts` exists in this project, so the name cannot be verified against a real implementation. The name is the documented Better Auth default and is consistent with common usage. Low risk — the section already labels it as a heuristic.

### Completeness

| Area                                    | Covered                                           |
| --------------------------------------- | ------------------------------------------------- |
| RSC protection with redirect            | ✅                                                 |
| Client hooks (`useSession`, etc.)       | ✅                                                 |
| Middleware (cookie-presence heuristic)  | ✅                                                 |
| Error handling (`{ data, error }`)      | ✅                                                 |
| TypeScript types                        | ✅ (with minor caveat above)                       |
| Plugin type-casting (`auth.api as ...`) | ✅                                                 |
| `databaseHooks`                         | ❌ Not covered — likely out of scope for this file |

**Verdict: ACCURATE. No breaking issues.**

---

## email-hooks.md

### Accuracy Checks

| Check                                                                                 | Result | Notes                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sendVerificationEmail` hook name in `emailVerification`                              | ✅ PASS | Exact match: `auth.ts` line `emailVerification.sendVerificationEmail`                                                                                                                           |
| `sendResetPassword` name in `emailAndPassword`                                        | ✅ PASS | Exact match: `auth.ts` line `emailAndPassword.sendResetPassword`                                                                                                                                |
| `sendChangeEmailConfirmation` (not `sendChangeEmailVerification`)                     | ✅ PASS | Correct. `auth.ts` uses `user.changeEmail.sendChangeEmailConfirmation`. The skill's warning note is warranted.                                                                                  |
| `sendDeleteAccountVerification` location                                              | ✅ PASS | Correctly documented under `user.deleteUser` — matches `auth.ts` exactly.                                                                                                                       |
| `hooks.after` single `createAuthMiddleware` pattern                                   | ✅ PASS | Exact match. `auth.ts` uses `hooks: { after: createAuthMiddleware(async (ctx) => { if (ctx.path.startsWith("/sign-up")) ... }) }`. The note about NOT using an array is accurate and important. |
| Organization invite hook location                                                     | ✅ PASS | `organization({ sendInvitationEmail: ... })` matches `auth.ts` plugin config.                                                                                                                   |
| `sendVerificationEmail` callback shape `({ user, url })`                              | ✅ PASS | Matches `auth.ts`                                                                                                                                                                               |
| `sendResetPassword` callback shape `({ user, url })`                                  | ✅ PASS | Matches `auth.ts`                                                                                                                                                                               |
| `sendChangeEmailConfirmation` callback shape `({ user, url, newEmail })`              | ✅ PASS | Matches `auth.ts`                                                                                                                                                                               |
| `sendDeleteAccountVerification` callback shape `({ user, url })`                      | ✅ PASS | Matches `auth.ts`                                                                                                                                                                               |
| `sendInvitationEmail` callback shape `({ email, organization, inviter, invitation })` | ✅ PASS | Matches `auth.ts`. `inviter.user` access pattern is correct.                                                                                                                                    |
| `ctx.context.newSession?.user ?? { name: ctx.body.name, email: ctx.body.email }`      | ✅ PASS | Verbatim match with `auth.ts` welcome email hook.                                                                                                                                               |

### Issues

**[COSMETIC] Invite URL uses inline string instead of routes file**  
The skill example hardcodes:
```typescript
const inviteUrl = `${process.env.BETTER_AUTH_URL}/organizations/invites/${invitation.id}`;
```
The actual `organization-invite-email.ts` uses `ROUTES.ORGANIZATIONS.INVITE(invitation.id)` which resolves to the same path. The URL produced is identical — this is not an error, just a style difference. Not worth fixing unless the skill targets this exact codebase.

### Completeness

| Hook / Area                                        | Covered |
| -------------------------------------------------- | ------- |
| Email verification (`sendVerificationEmail`)       | ✅       |
| Password reset (`sendResetPassword`)               | ✅       |
| Email change (`sendChangeEmailConfirmation`)       | ✅       |
| Account deletion (`sendDeleteAccountVerification`) | ✅       |
| Organization invite (`sendInvitationEmail`)        | ✅       |
| Welcome email via `hooks.after`                    | ✅       |
| `ctx` properties reference table                   | ✅       |
| Client trigger calls for each hook                 | ✅       |

**Verdict: ACCURATE. No breaking issues.**

---

## Summary

Both files are high quality and accurately reflect the codebase.

**Critical issues**: None.

**Non-critical issues**:
1. `server-client-patterns.md` §10 — Type export pattern is a suggestion, not present in actual `auth.ts`. Should be clarified.
2. `server-client-patterns.md` §8 — Cookie name unverifiable (no `middleware.ts` in project). Currently labelled as a default/heuristic which mitigates the risk.
3. `email-hooks.md` — Invite URL construction differs in style from actual code (inline string vs `ROUTES` helper), but produces the same URL. Cosmetic only.
