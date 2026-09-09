# Better Auth + Next.js Codebase — Comprehensive Technical Analysis

> Source: `/home/maruf/Development/Personal/Web/better-auth-crash-course`  
> Stack: Next.js 16 (App Router), Better Auth 1.4.x, Drizzle ORM, PostgreSQL, Postmark, Zod, React Hook Form, Tailwind CSS v4

---

## 1. Better Auth Server Configuration (`lib/auth/auth.ts`)

### 1.1 Instantiation

```ts
export const auth = betterAuth({ ... })
```

`auth` is the canonical server singleton. Imported directly in Server Components and API routes.

### 1.2 App Metadata

```ts
appName: "Better Auth Demo"
```

### 1.3 User Config — Custom Fields, Email Change, Account Deletion

```ts
user: {
  changeEmail: {
    enabled: true,
    sendChangeEmailConfirmation: async ({ user, url, newEmail }) => {
      // re-uses sendEmailVerificationEmail but replaces user.email with newEmail
      await sendEmailVerificationEmail({ user: { ...user, email: newEmail }, url });
    },
  },
  deleteUser: {
    enabled: true,
    sendDeleteAccountVerification: async ({ user, url }) => {
      await sendDeleteAccountVerificationEmail({ user, url });
    },
  },
  additionalFields: {
    favoriteNumber: {
      type: "number",
      required: true,        // must be provided on sign-up
    },
  },
},
```

- `changeEmail.enabled: true` — enables the `authClient.changeEmail()` API.
- `deleteUser.enabled: true` — enables `authClient.deleteUser()`.
- `favoriteNumber` — a custom integer field stored in the `user` table. Required at sign-up time and mapped from OAuth profiles via `mapProfileToUser`.

### 1.4 Email & Password

```ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,   // blocks sign-in until email is verified
  sendResetPassword: async ({ user, url }) => {
    await sendPasswordResetEmail({ user, url });
  },
},
```

`requireEmailVerification: true` means that after sign-up, the user cannot sign in until they click the verification link. If they try, Better Auth returns `error.code === "EMAIL_NOT_VERIFIED"`.

### 1.5 Email Verification

```ts
emailVerification: {
  autoSignInAfterVerification: true,   // signs in immediately after click
  sendOnSignUp: true,                  // sends the first verification email on sign-up
  sendVerificationEmail: async ({ user, url }) => {
    await sendEmailVerificationEmail({ user, url });
  },
},
```

### 1.6 Social OAuth Providers

```ts
socialProviders: {
  github: {
    clientId: env.CLIENT_ID_GITHUB,
    clientSecret: env.CLIENT_SECRET_GITHUB,
    mapProfileToUser: (profile) => ({
      favoriteNumber: Number(profile.public_repos) || 0,
    }),
  },
  discord: {
    clientId: env.CLIENT_ID_DISCORD,
    clientSecret: env.CLIENT_SECRET_DISCORD,
    mapProfileToUser: () => ({ favoriteNumber: 0 }),
  },
},
```

`mapProfileToUser` is required because `favoriteNumber` is a required additional field — without it, OAuth sign-up would fail.

### 1.7 Session Configuration

```ts
session: {
  expiresIn:  60 * 60 * 24 * 7,  // 7 days absolute expiry
  updateAge:  60 * 60 * 24,       // rolling: refresh session token every 24 h
  cookieCache: {
    enabled: true,
    maxAge:   60 * 60 * 24 * 7,  // 7 days cookie cache
    strategy: "jwt",              // stateless JWT validation (no DB hit on every request)
    refreshCache: true,           // allows silent cache refresh
  },
},
```

The `jwt` strategy means Better Auth can validate sessions without a DB round-trip on every request.

### 1.8 Plugins

| Plugin           | Import                             | Config                                       |
| ---------------- | ---------------------------------- | -------------------------------------------- |
| `nextCookies()`  | `better-auth/next-js`              | Enables HTTP-only cookie storage for Next.js |
| `twoFactor()`    | `better-auth/plugins/two-factor`   | No extra config; TOTP + backup codes         |
| `passkey()`      | `@better-auth/passkey`             | No extra config; WebAuthn registration/auth  |
| `adminPlugin()`  | `better-auth/plugins/admin`        | Custom `ac`, `admin` and `user` roles        |
| `organization()` | `better-auth/plugins/organization` | `sendInvitationEmail` hook                   |

### 1.9 Admin Plugin RBAC

```ts
adminPlugin({
  ac,                         // createAccessControl(defaultStatements)
  roles: {
    admin: adminAcStatements, // full CRUD via adminAc.statements
    user:  { ...userAc.statements, user: [...userAc.statements.user, "list"] },
  },
})
```

The `user` role is extended with `"list"` so any user can call `auth.admin.hasPermission({ user: ["list"] })` successfully — the home page uses this to show/hide the Admin nav link.

### 1.10 Organization Plugin

```ts
organization({
  sendInvitationEmail: async ({ email, organization, inviter, invitation }) => {
    await sendOrganizationInviteEmail({ invitation, inviter: inviter.user, organization, email });
  },
})
```

### 1.11 Database Adapter

```ts
database: drizzleAdapter(db, { provider: "pg" })
```

Uses the Drizzle adapter with a PostgreSQL provider.

### 1.12 Hooks — After Middleware

```ts
hooks: {
  after: createAuthMiddleware(async (ctx) => {
    if (ctx.path.startsWith("/sign-up")) {
      const user = ctx.context.newSession?.user ?? {
        name: ctx.body.name,
        email: ctx.body.email,
      };
      if (user != null) await sendWelcomeEmail(user);
    }
  }),
},
```

Fires after every request; only sends welcome email on sign-up paths.

### 1.13 Database Hooks — Session Create

```ts
databaseHooks: {
  session: {
    create: {
      before: async (userSession) => {
        // Looks up the user's most recent org membership
        const membership = await db.query.member.findFirst({
          where: eq(member.userId, userSession.userId),
          orderBy: desc(member.createdAt),
          columns: { organizationId: true },
        });
        // Writes activeOrganizationId into the session row
        return {
          data: { ...userSession, activeOrganizationId: membership?.organizationId },
        };
      },
    },
  },
},
```

This pre-populates `activeOrganizationId` on every new session so users land in their most recently joined org automatically.

---

## 2. Better Auth Client Configuration (`lib/auth/auth-client.ts`)

```ts
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),  // types favoriteNumber on session.user
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = ROUTES.AUTH.TWO_FACTOR;  // "/auth/2fa"
      },
    }),
    adminClient({
      ac,
      roles: {
        admin: adminAcStatements,
        user: { ...userAc.statements, user: [..., "list"] },
      },
    }),
    organizationClient(),
  ],
});
```

### 2.1 Available Hooks

| Hook                                 | Source               | Returns                                         |
| ------------------------------------ | -------------------- | ----------------------------------------------- |
| `authClient.useSession()`            | core                 | `{ data: Session \| null, isPending, refetch }` |
| `authClient.useActiveOrganization()` | `organizationClient` | `{ data: Organization \| null }`                |
| `authClient.useListOrganizations()`  | `organizationClient` | `{ data: Organization[] }`                      |

### 2.2 Key Client Methods (non-hooks)

| Method                                                                             | Description                                               |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `authClient.signUp.email(data, callbacks)`                                         | Email/password registration                               |
| `authClient.signIn.email(data, callbacks)`                                         | Email/password sign-in                                    |
| `authClient.signIn.social({ provider, callbackURL })`                              | OAuth redirect                                            |
| `authClient.signIn.passkey({ autoFill? })`                                         | WebAuthn sign-in                                          |
| `authClient.signOut()`                                                             | Sign out                                                  |
| `authClient.getSession()`                                                          | One-off session fetch (non-reactive)                      |
| `authClient.sendVerificationEmail({ email, callbackURL })`                         | Resend verification                                       |
| `authClient.requestPasswordReset({ email, redirectTo })`                           | Initiate password reset                                   |
| `authClient.resetPassword({ newPassword, token })`                                 | Complete password reset                                   |
| `authClient.updateUser(data)`                                                      | Update name, favoriteNumber, etc.                         |
| `authClient.changeEmail({ newEmail, callbackURL })`                                | Initiate email change                                     |
| `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions })` | Change password                                           |
| `authClient.deleteUser({ callbackURL })`                                           | Initiate account deletion                                 |
| `authClient.linkSocial({ provider, callbackURL })`                                 | Link an OAuth provider                                    |
| `authClient.revokeOtherSessions()`                                                 | Revoke all sessions except current                        |
| `authClient.twoFactor.enable({ password })`                                        | Begin 2FA enrollment (returns `{ totpURI, backupCodes }`) |
| `authClient.twoFactor.disable({ password })`                                       | Disable 2FA                                               |
| `authClient.twoFactor.verifyTotp({ code })`                                        | Verify TOTP challenge                                     |
| `authClient.twoFactor.verifyBackupCode({ code })`                                  | Verify backup code challenge                              |
| `authClient.passkey.addPasskey({ name })`                                          | Register new passkey                                      |
| `authClient.passkey.deletePasskey({ id })`                                         | Delete passkey                                            |
| `authClient.organization.create({ name, slug })`                                   | Create organization                                       |
| `authClient.organization.setActive({ organizationId })`                            | Switch active org                                         |
| `authClient.organization.inviteMember({ email, role })`                            | Send invitation                                           |
| `authClient.organization.cancelInvitation({ invitationId })`                       | Cancel invite                                             |
| `authClient.organization.acceptInvitation({ invitationId })`                       | Accept invite                                             |
| `authClient.organization.rejectInvitation({ invitationId })`                       | Reject invite                                             |
| `authClient.organization.removeMember({ memberIdOrEmail })`                        | Remove a member                                           |
| `authClient.admin.hasPermission({ permissions })`                                  | Check RBAC permission                                     |
| `authClient.admin.impersonateUser({ userId })`                                     | Start impersonation                                       |
| `authClient.admin.stopImpersonating()`                                             | End impersonation                                         |
| `authClient.admin.banUser({ userId })`                                             | Ban user                                                  |
| `authClient.admin.unbanUser({ userId })`                                           | Unban user                                                |
| `authClient.admin.revokeUserSessions({ userId })`                                  | Revoke all sessions for user                              |
| `authClient.admin.removeUser({ userId })`                                          | Delete user                                               |

---

## 3. Database Schema (`drizzle/schemas/auth-schema.ts`)

### 3.1 `user` Table

| Column             | Type                    | Notes                                           |
| ------------------ | ----------------------- | ----------------------------------------------- |
| `id`               | `text` PK               | Better Auth generated ID                        |
| `name`             | `text` NOT NULL         | Display name                                    |
| `email`            | `text` UNIQUE NOT NULL  | Login email                                     |
| `emailVerified`    | `boolean` DEFAULT false |                                                 |
| `image`            | `text`                  | Profile image URL from OAuth                    |
| `createdAt`        | `timestamp`             |                                                 |
| `updatedAt`        | `timestamp`             | Auto-updated                                    |
| `twoFactorEnabled` | `boolean`               | Added by `twoFactor()` plugin                   |
| `role`             | `text`                  | Added by `adminPlugin()`; `"admin"` or `"user"` |
| `banned`           | `boolean`               | Added by `adminPlugin()`                        |
| `banReason`        | `text`                  | Added by `adminPlugin()`                        |
| `banExpires`       | `timestamp`             | Added by `adminPlugin()`; null = permanent      |
| `favoriteNumber`   | `integer` NOT NULL      | Custom `additionalField`                        |

### 3.2 `session` Table

| Column                 | Type                          | Notes                                                   |
| ---------------------- | ----------------------------- | ------------------------------------------------------- |
| `id`                   | `text` PK                     |                                                         |
| `expiresAt`            | `timestamp` NOT NULL          |                                                         |
| `token`                | `text` UNIQUE NOT NULL        | Session token stored in cookie                          |
| `createdAt`            | `timestamp`                   |                                                         |
| `updatedAt`            | `timestamp`                   | Auto-updated                                            |
| `ipAddress`            | `text`                        | Client IP                                               |
| `userAgent`            | `text`                        | Browser/device fingerprint                              |
| `userId`               | `text` FK → `user.id` CASCADE |                                                         |
| `impersonatedBy`       | `text`                        | Added by `adminPlugin()`; stores admin's user ID        |
| `activeOrganizationId` | `text`                        | Added by `organization()` plugin; set by `databaseHook` |

### 3.3 `account` Table

| Column                  | Type                          | Notes                                     |
| ----------------------- | ----------------------------- | ----------------------------------------- |
| `id`                    | `text` PK                     |                                           |
| `accountId`             | `text` NOT NULL               | Provider's user ID                        |
| `providerId`            | `text` NOT NULL               | `"credential"`, `"github"`, `"discord"`   |
| `userId`                | `text` FK → `user.id` CASCADE |                                           |
| `accessToken`           | `text`                        |                                           |
| `refreshToken`          | `text`                        |                                           |
| `idToken`               | `text`                        | OIDC ID token                             |
| `accessTokenExpiresAt`  | `timestamp`                   |                                           |
| `refreshTokenExpiresAt` | `timestamp`                   |                                           |
| `scope`                 | `text`                        |                                           |
| `password`              | `text`                        | Hashed password for `credential` provider |
| `createdAt`             | `timestamp`                   |                                           |
| `updatedAt`             | `timestamp`                   | Auto-updated                              |

### 3.4 `verification` Table

| Column       | Type                 | Notes                     |
| ------------ | -------------------- | ------------------------- |
| `id`         | `text` PK            |                           |
| `identifier` | `text` NOT NULL      | Email or token identifier |
| `value`      | `text` NOT NULL      | The one-time token        |
| `expiresAt`  | `timestamp` NOT NULL |                           |
| `createdAt`  | `timestamp`          |                           |
| `updatedAt`  | `timestamp`          | Auto-updated              |

### 3.5 `twoFactor` Table (plugin: `twoFactor()`)

| Column        | Type                          | Notes                             |
| ------------- | ----------------------------- | --------------------------------- |
| `id`          | `text` PK                     |                                   |
| `secret`      | `text` NOT NULL               | TOTP shared secret                |
| `backupCodes` | `text` NOT NULL               | JSON array of hashed backup codes |
| `userId`      | `text` FK → `user.id` CASCADE |                                   |

### 3.6 `passkey` Table (plugin: `passkey()`)

| Column         | Type                          | Notes                              |
| -------------- | ----------------------------- | ---------------------------------- |
| `id`           | `text` PK                     |                                    |
| `name`         | `text`                        | User-assigned label                |
| `publicKey`    | `text` NOT NULL               | WebAuthn public key                |
| `userId`       | `text` FK → `user.id` CASCADE |                                    |
| `credentialID` | `text` NOT NULL               | WebAuthn credential ID             |
| `counter`      | `integer` NOT NULL            | Replay protection counter          |
| `deviceType`   | `text` NOT NULL               | `"platform"` or `"cross-platform"` |
| `backedUp`     | `boolean` NOT NULL            |                                    |
| `transports`   | `text`                        | Comma-separated transport methods  |
| `createdAt`    | `timestamp`                   |                                    |
| `aaguid`       | `text`                        | Authenticator AAGUID               |

### 3.7 `organization` Table (plugin: `organization()`)

| Column      | Type                 | Notes                                                 |
| ----------- | -------------------- | ----------------------------------------------------- |
| `id`        | `text` PK            |                                                       |
| `name`      | `text` NOT NULL      |                                                       |
| `slug`      | `text` UNIQUE        | URL-safe identifier (auto-generated via `createSlug`) |
| `logo`      | `text`               |                                                       |
| `createdAt` | `timestamp` NOT NULL |                                                       |
| `metadata`  | `text`               | JSON blob                                             |

### 3.8 `member` Table (plugin: `organization()`)

| Column           | Type                                  | Notes                            |
| ---------------- | ------------------------------------- | -------------------------------- |
| `id`             | `text` PK                             |                                  |
| `organizationId` | `text` FK → `organization.id` CASCADE |                                  |
| `userId`         | `text` FK → `user.id` CASCADE         |                                  |
| `role`           | `text` DEFAULT `"member"` NOT NULL    | `"owner"`, `"admin"`, `"member"` |
| `createdAt`      | `timestamp` NOT NULL                  |                                  |

### 3.9 `invitation` Table (plugin: `organization()`)

| Column           | Type                                  | Notes                                                 |
| ---------------- | ------------------------------------- | ----------------------------------------------------- |
| `id`             | `text` PK                             |                                                       |
| `organizationId` | `text` FK → `organization.id` CASCADE |                                                       |
| `email`          | `text` NOT NULL                       | Invitee email                                         |
| `role`           | `text`                                | Role granted on acceptance                            |
| `status`         | `text` DEFAULT `"pending"` NOT NULL   | `"pending"`, `"accepted"`, `"rejected"`, `"canceled"` |
| `expiresAt`      | `timestamp` NOT NULL                  |                                                       |
| `inviterId`      | `text` FK → `user.id` CASCADE         |                                                       |

### 3.10 Schema Relationships

```
user (1) ────────────────── (*) session         (CASCADE DELETE)
user (1) ────────────────── (*) account         (CASCADE DELETE)
user (1) ─────────────── (0..1) twoFactor       (CASCADE DELETE)
user (1) ────────────────── (*) passkey         (CASCADE DELETE)
user (1) ────────────────── (*) member          (CASCADE DELETE)
user (1) ────────────────── (*) invitation (inviterId) (CASCADE DELETE)
organization (1) ─────────── (*) member         (CASCADE DELETE)
organization (1) ─────────── (*) invitation     (CASCADE DELETE)
```

---

## 4. Authentication Flows

### 4.1 Sign-Up with Email/Password + Email Verification

**Client** (`app/auth/login/_components/tabs/sign-up-tab.tsx`):

```ts
// schema: { name, email, password, favoriteNumber }
const res = await authClient.signUp.email(
  { name, email, password, favoriteNumber, callbackURL: ROUTES.HOME },
  { onError: (error) => toast.error(error.error.message) }
);

// If email not yet verified, switch to verification tab
if (res.error == null && !res.data.user.emailVerified) {
  openEmailVerificationTab(email);
}
```

**What happens server-side:**
1. Better Auth creates a `user` record and `account` record with `providerId: "credential"`.
2. `emailVerification.sendVerificationEmail` hook fires → `sendEmailVerificationEmail()` via Postmark.
3. `hooks.after` fires for `/sign-up` path → `sendWelcomeEmail()`.
4. Because `requireEmailVerification: true`, the user's session is not created yet.

**Resend verification** (`app/auth/login/_components/forms/email-verification.tsx`):

```ts
await authClient.sendVerificationEmail({ email, callbackURL: ROUTES.HOME });
```

**After clicking verification link:**
- `autoSignInAfterVerification: true` → Better Auth creates a session and redirects to `callbackURL` (ROUTES.HOME).

---

### 4.2 Sign-In with Email/Password

**Client** (`app/auth/login/_components/tabs/sign-in-tab.tsx`):

```ts
await authClient.signIn.email(
  { email, password, callbackURL: ROUTES.HOME },
  {
    onError: (error) => {
      if (error.error.code === "EMAIL_NOT_VERIFIED") {
        openEmailVerificationTab(email);
      }
      toast.error(error.error.message);
    },
    onSuccess: () => router.push(ROUTES.HOME),
  }
);
```

**Special error codes:**
- `"EMAIL_NOT_VERIFIED"` — redirects user to the verification tab.
- If 2FA is enabled on the account, Better Auth returns a 2FA challenge response and `twoFactorClient` calls `onTwoFactorRedirect()` → `window.location.href = "/auth/2fa"`.

---

### 4.3 GitHub OAuth

**Client** (`app/auth/login/_components/buttons/social-auth-buttons.tsx`):

```ts
await authClient.signIn.social({ provider: "github", callbackURL: ROUTES.HOME });
```

Server-side: redirects to GitHub, callback lands at `/api/auth/callback/github`. Better Auth upserts user/account, maps `public_repos` → `favoriteNumber` via `mapProfileToUser`.

---

### 4.4 Discord OAuth

**Client** (same `SocialAuthButtons` component):

```ts
await authClient.signIn.social({ provider: "discord", callbackURL: ROUTES.HOME });
```

Server-side: `mapProfileToUser` returns `favoriteNumber: 0`.

---

### 4.5 Linking OAuth Accounts

**Client** (`app/profile/_components/account/account-linking.tsx`):

```ts
// Link a new provider
return authClient.linkSocial({ provider, callbackURL: ROUTES.PROFILE });
```

**Unlink** (same file):

```ts
// Better Auth unlink — not shown directly but available via authClient.unlinkAccount()
```

**Server** (`app/profile/_components/account/linked-accounts-tab.tsx`):

```ts
// Server component fetches accounts
const accounts = await auth.api.listUserAccounts({ headers: await headers() });
// Filter out "credential" provider — only show OAuth accounts
const nonCredentialAccounts = accounts.filter(a => a.providerId !== "credential");
```

---

### 4.6 Password Reset Flow

**Step 1 — Request reset** (`app/auth/login/_components/forms/forgot-password.tsx`):

```ts
await authClient.requestPasswordReset(
  { email, redirectTo: ROUTES.AUTH.RESET_PASSWORD },
  { onError: ..., onSuccess: () => toast.success("Password reset email sent") }
);
```

Server: `emailAndPassword.sendResetPassword` hook fires → `sendPasswordResetEmail()`.

**Step 2 — Complete reset** (`app/auth/reset-password/_components/reset-password-form.tsx`):

```ts
const token = searchParams.get("token");  // from URL query param

await authClient.resetPassword(
  { newPassword: data.password, token },
  {
    onError: ...,
    onSuccess: () => {
      toast.success("Password reset successful");
      setTimeout(() => router.push(ROUTES.AUTH.LOGIN), 1000);
    }
  }
);
```

**Error handling:** If `token` is null or `error` query param is set, shows "Invalid Reset Link" with Back to Login.

---

### 4.7 Email Change Flow

**Client** (`app/profile/_components/profile/profile-update-form.tsx`):

```ts
// Runs in parallel with profile update
const promises = [authClient.updateUser({ name, favoriteNumber })];

if (data.email !== user.email) {
  promises.push(
    authClient.changeEmail({ newEmail: data.email, callbackURL: ROUTES.PROFILE })
  );
}

await Promise.all(promises);
```

Server: `user.changeEmail.sendChangeEmailConfirmation` fires → `sendEmailVerificationEmail()` to the **new** email. User must click to confirm the change.

---

### 4.8 Passkey Registration

**Client** (`app/profile/_components/security/passkey-management.tsx`):

```ts
await authClient.passkey.addPasskey(
  { name: data.name },
  {
    onError: ...,
    onSuccess: () => { router.refresh(); setIsDialogOpen(false); }
  }
);
```

Creates a new `passkey` row. The browser WebAuthn dialog is triggered by `@better-auth/passkey`.

---

### 4.9 Passkey Sign-In (Silent + Manual)

**Automatic/silent** (auto-fill, on mount):

```ts
// app/auth/login/_components/buttons/passkey-button.tsx
useEffect(() => {
  authClient.signIn.passkey(
    { autoFill: true },
    { onSuccess() { refetch(); router.push(ROUTES.HOME); } }
  );
}, [router, refetch]);
```

**Manual:**

```ts
authClient.signIn.passkey(undefined, {
  onSuccess() { refetch(); router.push(ROUTES.HOME); }
});
```

The `autoComplete="email webauthn"` attribute on the email input in `sign-in-tab.tsx` enables browser-native passkey auto-fill suggestion.

---

### 4.10 TOTP 2FA Enrollment

**Client** (`app/profile/_components/security/two-factor-auth.tsx`):

```ts
// Step 1: Enable 2FA — returns totpURI and backupCodes
const result = await authClient.twoFactor.enable({ password: data.password });
// result.data = { totpURI: "otpauth://...", backupCodes: ["...", ...] }

// Step 2: Display QR code (react-qr-code renders totpURI)
<QRCode value={twoFactorData.totpURI} />
// Display backupCodes for user to save

// Step 3: Verify the TOTP code to confirm enrollment
await authClient.twoFactor.verifyTotp({ code: data.code });
// On success, sets user.twoFactorEnabled = true
```

**Disable 2FA:**

```ts
await authClient.twoFactor.disable(
  { password: data.password },
  { onSuccess: () => { form.reset(); router.refresh(); } }
);
```

---

### 4.11 2FA Challenge (TOTP + Backup Codes)

Triggered automatically after sign-in when `twoFactorEnabled = true`. The `twoFactorClient` intercepts the sign-in response and calls `onTwoFactorRedirect()` → navigates to `/auth/2fa`.

**TOTP challenge** (`app/auth/2fa/_components/forms/totp-form.tsx`):

```ts
await authClient.twoFactor.verifyTotp(
  { code: data.code },
  { onError: ..., onSuccess: () => router.push(ROUTES.HOME) }
);
```

**Backup code challenge** (`app/auth/2fa/_components/tabs/backup-code-tab.tsx`):

```ts
await authClient.twoFactor.verifyBackupCode(
  { code: data.code },
  { onError: ..., onSuccess: () => router.push(ROUTES.HOME) }
);
```

**2FA page guard** (server component `app/auth/2fa/page.tsx`):

```ts
const session = await auth.api.getSession({ headers: await headers() });
if (session != null) return redirect(ROUTES.HOME);  // already authenticated
```

---

### 4.12 Session Listing

**Server component** (`app/profile/_components/session/sessions-tab.tsx`):

```ts
const sessions = await auth.api.listSessions({ headers: await headers() });
// Returns Session[] for the current user
```

Passed to `SessionManagement` client component which separates current session from others using `session.token`.

---

### 4.13 Session Revocation

**Revoke a single session** (`app/profile/_components/session/session-management.tsx`):

```ts
// Individual session revocation (inside SessionCard, not shown in excerpt above)
authClient.revokeSession({ token: session.token });
```

**Revoke all other sessions:**

```ts
function revokeOtherSessions() {
  return authClient.revokeOtherSessions(undefined, {
    onSuccess: () => router.refresh(),
  });
}
```

---

### 4.14 Profile Update

**Client** (`app/profile/_components/profile/profile-update-form.tsx`):

```ts
await authClient.updateUser({
  name: data.name,
  favoriteNumber: data.favoriteNumber,
  // NOTE: email change is separate — see flow 4.7
});
```

`inferAdditionalFields<typeof auth>()` plugin ensures TypeScript knows about `favoriteNumber` on `updateUser`.

---

### 4.15 Password Change

**Client** (`app/profile/_components/security/change-password-form.tsx`):

```ts
await authClient.changePassword(
  {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
    revokeOtherSessions: data.revokeOtherSessions,  // checkbox, default true
  },
  { onError: ..., onSuccess: () => { toast.success(...); form.reset(); } }
);
```

---

### 4.16 Account Deletion

**Client** (`app/profile/_components/account/account-deletion.tsx`):

```ts
authClient.deleteUser({ callbackURL: ROUTES.HOME })
```

Server: `user.deleteUser.sendDeleteAccountVerification` hook fires → `sendDeleteAccountVerificationEmail()`. User must click the confirmation link to complete deletion.

---

### 4.17 Organization Creation

**Client** (`app/organizations/_components/buttons/create-organization-button.tsx`):

```ts
const slug = createSlug(data.name);  // lib/create-slug.ts — URL-safe slug

const res = await authClient.organization.create({ name: data.name, slug });

if (!res.error) {
  await authClient.organization.setActive({ organizationId: res.data.id });
}
```

Creator is automatically added as `owner` by the organization plugin.

---

### 4.18 Organization Member Invitation

**Client** (`app/organizations/_components/buttons/create-invite-button.tsx`):

```ts
// schema: { email: z.email(), role: z.enum(["member","admin"]) }
await authClient.organization.inviteMember(
  { email: data.email, role: data.role },
  { onError: ..., onSuccess: () => { form.reset(); setOpen(false); } }
);
```

Server: `organization.sendInvitationEmail` hook fires → `sendOrganizationInviteEmail()`. The email contains a link to `/organizations/invites/[id]`.

---

### 4.19 Invite Accept/Reject

**Server component** (`app/organizations/invites/[id]/page.tsx`):

```ts
// Fetch invitation server-side
const organizationApi = auth.api as typeof auth.api & ReturnType<typeof organization>["endpoints"];
const invitation = await organizationApi.getInvitation({
  headers: await headers(),
  query: { id },
}).catch(() => redirect(ROUTES.HOME));
```

**Client component** (`app/organizations/invites/[id]/_components/invite-information.tsx`):

```ts
// Accept
function acceptInvite() {
  return authClient.organization.acceptInvitation(
    { invitationId: invitation.id },
    {
      onSuccess: async () => {
        await authClient.organization.setActive({ organizationId: invitation.organizationId });
        router.push(ROUTES.ORGANIZATIONS.DASHBOARD);
      }
    }
  );
}

// Reject
function rejectInvite() {
  return authClient.organization.rejectInvitation(
    { invitationId: invitation.id },
    { onSuccess: () => router.push(ROUTES.HOME) }
  );
}
```

**Cancel invite** (`invites-tab.tsx`):

```ts
return authClient.organization.cancelInvitation({ invitationId });
```

---

### 4.20 Organization Context Switching

**Client** (`app/organizations/_components/select/organization-select.tsx`):

```ts
const { data: activeOrganization } = authClient.useActiveOrganization();
const { data: organizations } = authClient.useListOrganizations();

function setActiveOrganization(organizationId: string) {
  authClient.organization.setActive(
    { organizationId },
    { onError: error => toast.error(...) }
  );
}
```

The session's `activeOrganizationId` column is updated in-place.

---

### 4.21 Admin: List Users

**Server component** (`app/admin/page.tsx`):

```ts
const adminApi = auth.api as typeof auth.api & ReturnType<typeof admin>["endpoints"];

// Permission check
const hasAccess = await adminApi.userHasPermission({
  headers: await headers(),
  body: { permissions: { user: ["list"] } },
});
if (!hasAccess.success) return redirect(ROUTES.HOME);

// Fetch users
const users = await adminApi.listUsers({
  headers: await headers(),
  query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
});
// users.users: UserWithRole[]
// users.total: number
```

---

### 4.22 Admin: Impersonate User

**Client** (`app/admin/_components/user-row.tsx`):

```ts
authClient.admin.impersonateUser(
  { userId },
  {
    onError: error => toast.error(...),
    onSuccess: () => { refetch(); router.push(ROUTES.HOME); }
  }
);
```

Session's `impersonatedBy` field is set to the admin's user ID. The `ImpersonationIndicator` component checks `session.session.impersonatedBy != null` to show a "stop impersonating" button.

**Stop impersonation** (`components/auth/buttons/impersonation-indicator.tsx`):

```ts
authClient.admin.stopImpersonating(undefined, {
  onSuccess: () => { router.push(ROUTES.ADMIN); refetch(); }
});
```

---

### 4.23 Admin: Ban / Unban User

**Client** (`app/admin/_components/user-row.tsx`):

```ts
// Ban
authClient.admin.banUser({ userId }, { onSuccess: () => { toast.success("User banned"); router.refresh(); } });

// Unban
authClient.admin.unbanUser({ userId }, { onSuccess: () => { toast.success("User unbanned"); router.refresh(); } });
```

Writes `banned: true` and `banExpires: null` (permanent) to the `user` row.

---

### 4.24 Admin: Delete User

**Client** (`app/admin/_components/user-row.tsx`):

```ts
authClient.admin.removeUser(
  { userId },
  { onSuccess: () => { toast.success("User deleted"); router.refresh(); } }
);
```

---

### 4.25 Admin: Revoke Any Session

**Client** (`app/admin/_components/user-row.tsx`):

```ts
authClient.admin.revokeUserSessions(
  { userId },
  { onSuccess: () => toast.success("User sessions revoked") }
);
```

---

## 5. Server vs Client Auth Patterns

### 5.1 Server-Side Auth (`auth.api.getSession`)

Used in **async Server Components** via `next/headers`:

```ts
// Pattern used in: profile/page.tsx, admin/page.tsx, organizations/page.tsx,
//                  auth/2fa/page.tsx, organizations/invites/[id]/page.tsx
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const session = await auth.api.getSession({ headers: await headers() });
if (session == null) return redirect(ROUTES.AUTH.LOGIN);

const user = session.user as typeof session.user & {
  favoriteNumber: number;
  role?: string;
  twoFactorEnabled?: boolean;
};
```

The type cast is needed because `inferAdditionalFields` only applies to the client; on the server you must cast manually.

### 5.2 Server-Side: Other auth.api calls

```ts
// list sessions
auth.api.listSessions({ headers: await headers() })

// list user accounts
auth.api.listUserAccounts({ headers: await headers() })

// list passkeys (requires casting)
const passkeyApi = auth.api as typeof auth.api & ReturnType<typeof passkey>["endpoints"];
passkeyApi.listPasskeys({ headers: await headers() })

// admin: list users, check permission (requires casting)
const adminApi = auth.api as typeof auth.api & ReturnType<typeof admin>["endpoints"];
adminApi.userHasPermission({ headers: ..., body: { permissions: { user: ["list"] } } })
adminApi.listUsers({ headers: ..., query: { limit, sortBy, sortDirection } })

// organization: get invitation (requires casting)
const orgApi = auth.api as typeof auth.api & ReturnType<typeof organization>["endpoints"];
orgApi.getInvitation({ headers: ..., query: { id } })
```

### 5.3 Client-Side Auth (`authClient.useSession`)

Used in **Client Components** (`"use client"`):

```ts
// app/page.tsx
const { data: session, isPending: loading } = authClient.useSession();

// admin/_components/user-row.tsx
const { refetch } = authClient.useSession();
// refetch() called after impersonation to reload session data
```

### 5.4 Client-Side: One-shot Session Check

```ts
// app/auth/login/page.tsx — redirect authenticated users away from login
useEffect(() => {
  authClient.getSession().then((session) => {
    if (session.data != null) router.push(ROUTES.HOME);
  });
}, [router]);
```

### 5.5 No Middleware

There is **no** `middleware.ts` in this codebase. Route protection is handled page-by-page via `auth.api.getSession()` + `redirect()` in Server Components.

---

## 6. Environment Variables

| Variable                | Required                | Purpose                                                                                                  |
| ----------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Yes                     | PostgreSQL connection string for Drizzle + Better Auth                                                   |
| `BETTER_AUTH_SECRET`    | Yes                     | Signing key for JWT sessions and tokens                                                                  |
| `BETTER_AUTH_URL`       | Yes                     | App base URL (used in org invite links: `process.env.BETTER_AUTH_URL + ROUTES.ORGANIZATIONS.INVITE(id)`) |
| `CLIENT_ID_GITHUB`      | Yes (for GitHub OAuth)  | GitHub OAuth App client ID                                                                               |
| `CLIENT_SECRET_GITHUB`  | Yes (for GitHub OAuth)  | GitHub OAuth App client secret                                                                           |
| `CLIENT_ID_DISCORD`     | Yes (for Discord OAuth) | Discord Application client ID                                                                            |
| `CLIENT_SECRET_DISCORD` | Yes (for Discord OAuth) | Discord Application client secret                                                                        |
| `POSTMARK_SERVER_TOKEN` | Yes (for emails)        | Postmark server API token                                                                                |
| `POSTMARK_FROM_EMAIL`   | Yes (for emails)        | Sender email address for transactional emails                                                            |

---

## 7. Email System

### 7.1 Transport (`lib/emails/send-email.ts`)

```ts
const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN!);

export function sendEmail({ to, subject, html, text }) {
  return postmarkClient.sendEmail({
    From: process.env.POSTMARK_FROM_EMAIL!,
    To: to,
    Subject: subject,
    HtmlBody: html,
    TextBody: text,
  });
}
```

All emails are sent through a single Postmark `ServerClient` instance.

### 7.2 Email Triggers

| Email                           | Trigger Location                                             | When Fired                                              |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| **Welcome**                     | `hooks.after` (createAuthMiddleware) in `auth.ts`            | Every `/sign-up` request (email or OAuth)               |
| **Email Verification**          | `emailVerification.sendVerificationEmail` in `auth.ts`       | On sign-up (`sendOnSignUp: true`)                       |
| **Email Verification (resend)** | `authClient.sendVerificationEmail()`                         | On user request from `EmailVerification` component      |
| **Email Change Confirmation**   | `user.changeEmail.sendChangeEmailConfirmation` in `auth.ts`  | When `authClient.changeEmail()` is called               |
| **Password Reset**              | `emailAndPassword.sendResetPassword` in `auth.ts`            | When `authClient.requestPasswordReset()` is called      |
| **Account Deletion**            | `user.deleteUser.sendDeleteAccountVerification` in `auth.ts` | When `authClient.deleteUser()` is called                |
| **Organization Invite**         | `organization.sendInvitationEmail` in `auth.ts`              | When `authClient.organization.inviteMember()` is called |

---

## 8. Role-Based Access Control (RBAC)

### 8.1 Global Roles (`lib/auth/roles.ts`)

```ts
export const GLOBAL_ROLES = {
  ADMIN: "admin",
  USER:  "user",
} as const;
```

Stored in `user.role` column.

### 8.2 Organization Roles (`lib/auth/roles.ts`)

```ts
export const ORG_ROLES = {
  OWNER:  "owner",
  ADMIN:  "admin",
  MEMBER: "member",
} as const;
```

Stored in `member.role` column.

### 8.3 Access Control Definition (`components/auth/utils/permissions.ts`)

```ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, userAc, adminAc } from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

// user role: inherits default userAc + can list users
export const user = ac.newRole({
  ...userAc.statements,
  user: [...userAc.statements.user, "list"],
});

// admin role: full CRUD from adminAc
export const admin = ac.newRole(adminAc.statements);
```

The `ac`, `admin`, and `user` exports are shared between `auth.ts` (server) and `auth-client.ts` (client) to keep roles in sync.

### 8.4 Permission Check Patterns

**Server-side (server component):**

```ts
const hasAccess = await adminApi.userHasPermission({
  headers: await headers(),
  body: { permissions: { user: ["list"] } },
});
if (!hasAccess.success) return redirect(ROUTES.HOME);
```

**Client-side (useEffect):**

```ts
authClient.admin
  .hasPermission({ permissions: { user: ["list"] } })
  .then(({ data }) => setHasAdminPermission(data?.success ?? false));
```

Note: Because `user` role also has `"list"`, **all** authenticated users can technically access the admin page — the admin page just lists users. Destructive admin actions (ban, delete) would require higher permissions in a real app.

---

## 9. Organization Features

### 9.1 Creation

```ts
// Client
const res = await authClient.organization.create({ name, slug });
await authClient.organization.setActive({ organizationId: res.data.id });
```

Creator becomes the `owner` member automatically.

### 9.2 Active Organization Context

Stored in `session.activeOrganizationId`. On every new session creation, the `databaseHook` pre-populates it with the user's most recently joined org.

`authClient.useActiveOrganization()` returns the current org with full `members` and `invitations` arrays populated.

### 9.3 Invitation Flow

1. Admin/owner calls `authClient.organization.inviteMember({ email, role: "member"|"admin" })`.
2. `sendInvitationEmail` hook fires → email with link to `/organizations/invites/[id]`.
3. Invitee (must be logged in) visits the page; server fetches invitation via `orgApi.getInvitation()`.
4. Invitee calls `authClient.organization.acceptInvitation({ invitationId })` or `rejectInvitation`.
5. On accept: `authClient.organization.setActive({ organizationId })` switches context, then redirect.

### 9.4 Member Removal

```ts
authClient.organization.removeMember({ memberIdOrEmail: member.id });
```

Can only remove non-self members (guarded in `MembersTab` with `member.userId !== session?.user.id`).

### 9.5 Invite Cancellation

```ts
authClient.organization.cancelInvitation({ invitationId });
```

---

## 10. Custom User Fields (`additionalFields`)

### 10.1 Definition

```ts
// auth.ts
user: {
  additionalFields: {
    favoriteNumber: {
      type: "number",
      required: true,
    },
  },
}
```

### 10.2 DB Column

```ts
// auth-schema.ts
favoriteNumber: integer("favorite_number").notNull()
```

### 10.3 Sign-Up

The `signUpSchema` includes `favoriteNumber`:

```ts
export const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.email().min(1),
  password: z.string().min(6),
  favoriteNumber: z.number().int(),
});
```

Passed to `authClient.signUp.email({ ..., favoriteNumber })`.

### 10.4 OAuth Mapping

Both providers use `mapProfileToUser` to supply `favoriteNumber`:

```ts
// GitHub: maps public_repos count
mapProfileToUser: (profile) => ({ favoriteNumber: Number(profile.public_repos) || 0 })

// Discord: always 0
mapProfileToUser: () => ({ favoriteNumber: 0 })
```

### 10.5 Updating

```ts
await authClient.updateUser({ name, favoriteNumber });
```

### 10.6 Accessing on Client

`inferAdditionalFields<typeof auth>()` plugin extends the TypeScript type of `session.user` to include `favoriteNumber: number`.

### 10.7 Accessing on Server

```ts
const user = session.user as typeof session.user & { favoriteNumber: number; role?: string; twoFactorEnabled?: boolean };
```

Manual type cast required; server does not use `inferAdditionalFields`.

---

## 11. Component Architecture Patterns

### 11.1 BetterAuthActionButton

A wrapper around `ActionButton` that normalizes Better Auth's `{ error: null | { message } }` response shape:

```ts
// components/auth/buttons/better-auth-action-button.tsx
<BetterAuthActionButton
  action={() => authClient.someMethod(...)}
  successMessage="Optional success toast"
  requireAreYouSure   // shows AlertDialog confirmation
  variant="destructive"
>
  Label
</BetterAuthActionButton>
```

### 11.2 Server → Client Data Flow Pattern

Profile page and security tab follow this pattern:

```
ProfilePage (Server Component)
├── calls auth.api.getSession()
├── redirects if null
└── renders:
    ├── SecurityTab (Server Component — loads passkeys, accounts via auth.api)
    │   └── renders ChangePasswordForm, TwoFactorAuth, PasskeyManagement (all "use client")
    ├── SessionsTab (Server Component — loads sessions via auth.api)
    │   └── renders SessionManagement ("use client")
    └── LinkedAccountsTab (Server Component — loads accounts via auth.api)
        └── renders AccountLinking ("use client")
```

All Server Components inside tabs are wrapped in `<LoadingSuspense>` (a `<Suspense>` boundary) to enable streaming.

### 11.3 Plugin API Type Casting

When calling plugin-specific server endpoints, a cast is required:

```ts
// Passkey plugin endpoints
const passkeyApi = auth.api as typeof auth.api & ReturnType<typeof passkey>["endpoints"];

// Admin plugin endpoints
const adminApi = auth.api as typeof auth.api & ReturnType<typeof admin>["endpoints"];

// Organization plugin endpoints
const orgApi = auth.api as typeof auth.api & ReturnType<typeof organization>["endpoints"];
```

---

## 12. Route Structure

```ts
// lib/routes.ts
export const ROUTES = {
  HOME:    "/",
  ADMIN:   "/admin",
  PROFILE: "/profile",
  AUTH: {
    LOGIN:          "/auth/login",
    TWO_FACTOR:     "/auth/2fa",
    RESET_PASSWORD: "/auth/reset-password",
  },
  ORGANIZATIONS: {
    DASHBOARD: "/organizations",
    INVITE: (id: string) => `/organizations/invites/${id}`,
  },
} as const;
```

### Route Protection Summary

| Route                         | Protection                                               | Method                                                   |
| ----------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| `/`                           | None (shows session-conditional UI)                      | `authClient.useSession()`                                |
| `/auth/login`                 | Redirect away if authenticated                           | `authClient.getSession()` in `useEffect`                 |
| `/auth/2fa`                   | Redirect to home if already authenticated                | `auth.api.getSession()` in server component              |
| `/auth/reset-password`        | None (token in URL)                                      | Client validates `token` param                           |
| `/profile`                    | Redirect to login if unauthenticated                     | `auth.api.getSession()` in server component              |
| `/admin`                      | Redirect if unauthenticated OR no `user:list` permission | `auth.api.getSession()` + `adminApi.userHasPermission()` |
| `/organizations`              | Redirect to login if unauthenticated                     | `auth.api.getSession()` in server component              |
| `/organizations/invites/[id]` | Redirect to login if unauthenticated                     | `auth.api.getSession()` in server component              |

---

## 13. Validation Schemas (Zod)

| File                             | Schema                            | Fields                                              |
| -------------------------------- | --------------------------------- | --------------------------------------------------- |
| `schemas/sign-up.ts`             | `signUpSchema`                    | `name, email, password, favoriteNumber`             |
| `schemas/sign-in.ts`             | `signInSchema`                    | `email, password`                                   |
| `schemas/forgot-password.ts`     | `forgotPasswordSchema`            | `email`                                             |
| `schemas/reset-password.ts`      | `resetPasswordSchema`             | `password`                                          |
| `schemas/profile-update.ts`      | `profileUpdateSchema`             | `name, email, favoriteNumber`                       |
| `schemas/change-password.ts`     | `changePasswordSchema`            | `currentPassword, newPassword, revokeOtherSessions` |
| `schemas/two-factor-auth.ts`     | `twoFactorAuthSchema`, `qrSchema` | `password` / `code`                                 |
| `schemas/totp.ts`                | `totpSchema`                      | `code` (6-digit)                                    |
| `schemas/backup-code.ts`         | `backupCodeSchema`                | `code`                                              |
| `schemas/passkey.ts`             | `passkeySchema`                   | `name`                                              |
| `schemas/create-organization.ts` | `createOrganizationSchema`        | `name`                                              |
| `schemas/create-invite.ts`       | `createInviteSchema`              | `email, role` (enum `member                         | admin`) |

---

## 14. Key Dependencies

| Package                | Version   | Purpose                            |
| ---------------------- | --------- | ---------------------------------- |
| `better-auth`          | `^1.4.10` | Auth framework                     |
| `@better-auth/passkey` | `^1.4.10` | Passkey/WebAuthn plugin            |
| `next`                 | `16.1.1`  | Next.js framework (App Router)     |
| `drizzle-orm`          | `^0.45.1` | ORM                                |
| `drizzle-kit`          | `^0.31.8` | Schema management CLI              |
| `pg`                   | `^8.16.3` | PostgreSQL driver                  |
| `postmark`             | `^4.0.5`  | Transactional email                |
| `react-hook-form`      | `^7.69.0` | Form management                    |
| `@hookform/resolvers`  | `^5.2.2`  | Zod integration for RHF            |
| `zod`                  | `^4.3.2`  | Schema validation                  |
| `react-qr-code`        | `^2.0.18` | QR code for TOTP enrollment        |
| `ua-parser-js`         | `^2.0.7`  | Parse userAgent in session display |
| `sonner`               | `^2.0.7`  | Toast notifications                |
| `tailwindcss`          | `^4.1.18` | CSS                                |

---

## 15. NPM Scripts

```json
"dev":            "next dev --turbo"          // dev server with Turbopack
"build":          "next build --turbo"
"db:generate":    "drizzle-kit generate"      // generate migration from schema diff
"db:migrate":     "drizzle-kit migrate"       // apply pending migrations
"db:studio":      "drizzle-kit studio"        // Drizzle Studio on :4983
"db:push":        "drizzle-kit push"          // direct schema push (no migration file)
"auth:generate":  "npx @better-auth/cli@latest generate --config ./lib/auth/auth.ts --output ./drizzle/schemas/new-auth-schema.ts --yes"
```

`auth:generate` regenerates the Drizzle schema from the Better Auth config. The output is compared to `auth-schema.ts` and differences are applied manually before running `db:generate`.
