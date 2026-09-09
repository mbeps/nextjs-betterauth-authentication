# Evaluation: authentication.md + two-factor-auth.md

> Evaluated against: `lib/auth/auth.ts`, `lib/auth/auth-client.ts`, `drizzle/schemas/auth-schema.ts`,
> `app/auth/2fa/page.tsx`, `schemas/sign-up.ts`, `schemas/sign-in.ts`,
> `docs/SubAgent docs/better-auth-docs.md`, `docs/SubAgent docs/codebase-analysis.md`
> Date: 2026-08-11

---

## Verdict

| File                 | Overall | Critical Issues | Minor Issues |
| -------------------- | ------- | --------------- | ------------ |
| `authentication.md`  | PASS    | 0               | 3            |
| `two-factor-auth.md` | PASS    | 0               | 2            |

Both files are accurate, well-structured, and match the real codebase. No critical bugs found.

---

## 1. authentication.md

### 1.1 Accuracy

| Claim                                                                                | Status | Evidence                                                                                                         |
| ------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `authClient.signUp.email()` accepts `favoriteNumber` as a custom field               | ✓      | `auth.ts` `additionalFields.favoriteNumber`, `signUpSchema`                                                      |
| `requireEmailVerification: true` blocks sign-in                                      | ✓      | `auth.ts` confirms; `codebase-analysis.md` confirms                                                              |
| `ctx.error.code === "EMAIL_NOT_VERIFIED"` for unverified sign-in                     | ✓      | `codebase-analysis.md` §1.4: "Better Auth returns `error.code === "EMAIL_NOT_VERIFIED"`"                         |
| `twoFactorClient` `onTwoFactorRedirect` fires automatically; `onSuccess` is bypassed | ✓      | `auth-client.ts` `twoFactorClient({ onTwoFactorRedirect: () => window.location.href = ROUTES.AUTH.TWO_FACTOR })` |
| `sendChangeEmailConfirmation` hook name                                              | ✓      | Exact match in `auth.ts` `user.changeEmail.sendChangeEmailConfirmation`                                          |
| `authClient.changeEmail({ newEmail, callbackURL })`                                  | ✓      | Official docs §4 confirm method and params                                                                       |
| `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions })`   | ✓      | Official docs §4 confirm                                                                                         |
| `authClient.requestPasswordReset({ email, redirectTo })`                             | ✓      | Official docs confirm `redirectTo` (not `callbackURL`)                                                           |
| `authClient.resetPassword({ newPassword, token })`                                   | ✓      | Official docs confirm                                                                                            |
| Session uses JWT cookie cache (`strategy: "jwt"`)                                    | ✓      | `auth.ts` `session.cookieCache.strategy: "jwt"`                                                                  |
| `inferAdditionalFields<typeof auth>()` plugin                                        | ✓      | `auth-client.ts` confirms                                                                                        |
| `input: false` security note for server-only fields                                  | ✓      | Official docs §3 and better-auth-docs.md §3                                                                      |

**No accuracy errors found.**

### 1.2 Minor Issues

**M-1: `callbackURL: "/"` in `signIn.email()` example — silent no-op for 2FA users**

Section 1.2 shows:
```typescript
await authClient.signIn.email({
  email,
  password,
  rememberMe: true,
  callbackURL: "/",    // ← this line
}, { ... });
```

When `twoFactorClient` fires `onTwoFactorRedirect`, the `callbackURL` is not applied — the hard
redirect to `/auth/2fa` takes over. The example should either remove `callbackURL` from the 2FA
context or add a note explaining it only applies after the full auth flow (including 2FA) completes.
No functional bug — just a potential source of confusion for developers who expect `callbackURL`
to govern 2FA post-login redirect.

**M-2: Sign-out discoverability**

Sign-out is covered correctly in §3.3 under "Reading Auth State" but is absent from the ToC and
from §1 (Email & Password). A developer looking for "how do I sign out" will likely search §1
and may miss it. Consider adding a sign-out subsection reference to §1, or promoting it in the ToC.

**M-3: `EMAIL_NOT_VERIFIED` vs HTTP status 403 — dual approaches**

The skill uses the named code approach (`ctx.error.code === "EMAIL_NOT_VERIFIED"`), which is
correct per `codebase-analysis.md`. The official docs example uses `ctx.error.status === 403`.
Both work. The skill's named-code approach is actually more precise and preferred. Adding a brief
comment noting that `status === 403` is an equivalent alternative would prevent confusion when
developers see the official docs use a different pattern.

### 1.3 Completeness

| Flow                                             | Covered                          |
| ------------------------------------------------ | -------------------------------- |
| Sign-up                                          | ✓ §1.1                           |
| Sign-in                                          | ✓ §1.2                           |
| Email verification (re-send + auto-sign-in)      | ✓ §1.3                           |
| Password reset (two-step)                        | ✓ §1.4                           |
| Email change                                     | ✓ §1.5                           |
| Password change                                  | ✓ §1.6                           |
| OAuth sign-in (GitHub, Discord)                  | ✓ §2                             |
| OAuth account linking                            | ✓ §2.3                           |
| OAuth account unlinking                          | ✓ §2.4                           |
| Listing linked accounts (client + server)        | ✓ §2.5                           |
| `mapProfileToUser` for required additionalFields | ✓ §2.6                           |
| Sign-out (client + server action)                | ✓ §3.3                           |
| Session listing / revocation                     | ✓ §3.4                           |
| additionalFields server config                   | ✓ §4.1                           |
| additionalFields TypeScript inference            | ✓ §4.3                           |
| Type inference patterns                          | ✓ §5                             |
| Error codes for sign-in failures                 | ✓ `EMAIL_NOT_VERIFIED` mentioned |

All required flows are present. Nothing missing.

### 1.4 Consistency with server-client-patterns.md

No cross-file inconsistencies detected. The RSC session pattern (`auth.api.getSession({ headers: await headers() })`),
the server action pattern (`auth.api.signOut`), and the `nextCookies()` relationship are all
consistent with the actual codebase.

---

## 2. two-factor-auth.md

### 2.1 Accuracy

| Claim                                                                                                        | Status | Evidence                                                                           |
| ------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------- |
| `twoFactor()` plugin added to `plugins` array server-side                                                    | ✓      | `auth.ts` `plugins: [twoFactor()]`                                                 |
| `appName: "Better Auth Demo"` used as TOTP issuer                                                            | ✓      | `auth.ts` and `codebase-analysis.md`                                               |
| `twoFactorClient({ onTwoFactorRedirect })` client plugin                                                     | ✓      | `auth-client.ts` exact match                                                       |
| `twoFactor.enable({ password })` returns `{ totpURI, backupCodes }`                                          | ✓      | better-auth-docs.md §6: `// Returns: { totpURI, backupCodes }`                     |
| `twoFactor.enable()` does NOT set `twoFactorEnabled: true` yet                                               | ✓      | better-auth-docs.md §6: "twoFactorEnabled stays false until user verifies TOTP"    |
| `twoFactor.verifyTotp({ code })` sets `twoFactorEnabled: true`                                               | ✓      | Official docs confirm                                                              |
| `twoFactor.disable({ password })`                                                                            | ✓      | better-auth-docs.md `// POST /two-factor/disable`                                  |
| `twoFactor.generateBackupCodes({ password })` → `result.data.backupCodes`                                    | ✓      | better-auth-docs.md §6                                                             |
| `auth.api.viewBackupCodes({ body: { userId } })` server-only                                                 | ✓      | better-auth-docs.md §6                                                             |
| `verifyTotp` + `verifyBackupCode` accept `trustDevice: true`                                                 | ✓      | better-auth-docs.md §6                                                             |
| `twoFactor` DB table columns (`secret`, `backupCodes`, `verified`, `failedVerificationCount`, `lockedUntil`) | ✓      | better-auth-docs.md §6 schema additions                                            |
| `twoFactorEnabled` boolean on `user` table                                                                   | ✓      | `drizzle/schemas/auth-schema.ts` `twoFactorEnabled: boolean("two_factor_enabled")` |
| 2FA challenge page guard (`session != null → redirect HOME`)                                                 | ✓      | `app/auth/2fa/page.tsx` exact match                                                |
| Manual check: `ctx.data.twoFactorRedirect` in `onSuccess`                                                    | ✓      | better-auth-docs.md §6 sign-in flow                                                |
| `twoFactor.sendOtp()` + `verifyOtp()` for OTP email path                                                     | ✓      | better-auth-docs.md §6                                                             |

**No accuracy errors found.**

### 2.2 Method Name Verification

- `authClient.twoFactor.enable` ✓
- `authClient.twoFactor.verifyTotp` ✓
- `authClient.twoFactor.verifyBackupCode` ✓
- `authClient.twoFactor.disable` ✓
- `authClient.twoFactor.generateBackupCodes` ✓
- `authClient.twoFactor.sendOtp` ✓
- `authClient.twoFactor.verifyOtp` ✓
- `auth.api.viewBackupCodes` ✓

The skill does **not** document `authClient.twoFactor.getTotpUri({ password })` (a separate method
for fetching the TOTP URI outside the enrollment flow). This is minor — the enrollment section
correctly uses `enable()` — but the method is useful when re-displaying a QR code to a user who
already enrolled. See M-4 below.

### 2.3 Minor Issues

**M-4: Missing `getTotpUri()` method**

The official docs expose `authClient.twoFactor.getTotpUri({ password })` for fetching the TOTP
URI after enrollment (e.g. "show QR code again" UI). The skill only documents `enable()` returning
the URI on initial enrollment. A developer building a "re-display my QR code" feature would not
find the right method here.

```typescript
// Missing from skill:
const { data } = await authClient.twoFactor.getTotpUri({ password });
// data.totpURI — same otpauth:// format; safe to call post-enrollment
```

**M-5: `issuer` override on `enable()` not mentioned**

The official docs show `twoFactor.enable({ password, issuer: "my-app-name" })` as an optional
per-call override. The skill documents the server-level `issuer` config but not the per-call
override. Low priority (this project doesn't use it), but worth one line.

### 2.4 Completeness

| Flow                                                            | Covered                          |
| --------------------------------------------------------------- | -------------------------------- |
| Plugin setup (server + client)                                  | ✓ §1                             |
| Database schema additions                                       | ✓ §2                             |
| Enrollment: enable() → verifyTotp() sequence                    | ✓ §3 (with Step 1/2/3 structure) |
| Codebase pattern reference                                      | ✓ §3 (profile component example) |
| 2FA challenge: automatic redirect                               | ✓ §4                             |
| 2FA challenge: manual check alternative                         | ✓ §4                             |
| TOTP verification at challenge                                  | ✓ §4                             |
| Backup code verification at challenge                           | ✓ §4                             |
| Disabling 2FA                                                   | ✓ §5                             |
| Backup code lifecycle (enrollment + regeneration + server view) | ✓ §6                             |
| Trusted devices                                                 | ✓ §7                             |
| OTP email alternative                                           | ✓ §8                             |
| Server-side `twoFactorEnabled` check                            | ✓ §9                             |
| Re-display QR code after enrollment                             | ✗ Missing `getTotpUri`           |

### 2.5 Security Coverage

- Backup codes shown once only: ✓ explicitly stated
- Backup codes consumed on use: ✓ stated
- Regeneration invalidates all previous codes: ✓ stated
- Account lockout config: ✓ documented in §1 server config
- `trustDevice` 30-day window: ✓ documented in §7

### 2.6 Consistency with authentication.md

The 2FA challenge flow is described **consistently** between both files:

- Both agree `onTwoFactorRedirect` fires and `onSuccess` is bypassed (automatic approach)
- Both agree `ctx.data.twoFactorRedirect` is truthy in `onSuccess` (manual approach)
- `twoFactorEnabled` field name is consistent across both files and matches the DB schema

No cross-file conflicts.

---

## 3. Cross-Cutting Notes

### What both files get right

1. The `twoFactor.enable()` → `verifyTotp()` two-step sequence is correctly documented and matches the official docs exactly.
2. The `onTwoFactorRedirect` vs manual `twoFactorRedirect` check distinction is accurate and useful.
3. The `sendChangeEmailConfirmation` hook name is correct (a commonly confused point with `sendChangeEmailVerification`).
4. `input: false` security guidance for server-only fields is present and correct.
5. All method names verified against official docs — no name errors.

### What to add (priority order)

| Priority | File                 | Issue                                                                                |
| -------- | -------------------- | ------------------------------------------------------------------------------------ |
| Low      | `authentication.md`  | Note that `callbackURL` in `signIn.email()` is applied post-2FA, not during redirect |
| Low      | `two-factor-auth.md` | Add `getTotpUri({ password })` as a "re-display QR" method                           |
| Low      | `authentication.md`  | Note `status === 403` is equivalent to `code === "EMAIL_NOT_VERIFIED"`               |
| Cosmetic | `authentication.md`  | Promote sign-out to ToC or §1                                                        |
| Cosmetic | `two-factor-auth.md` | Document `issuer` override on `enable()`                                             |
