# Better Auth — Comprehensive API Reference

> Compiled from official docs on 2026-08-11. URLs fetched: installation, typescript, email-password, 2fa, passkey, organization, admin, session-management, drizzle-adapter, hooks, oauth.
> URLs that returned 404: `/docs/authentication/social-sign-on`, `/docs/integrations/next-js`, `/docs/authentication/passkey`.

---

## Table of Contents

1. [Installation](#1-installation)
2. [Environment Variables](#2-environment-variables)
3. [TypeScript Integration](#3-typescript-integration)
4. [Email & Password Authentication](#4-email--password-authentication)
5. [OAuth / Social Sign-On](#5-oauth--social-sign-on)
6. [Two-Factor Authentication (2FA)](#6-two-factor-authentication-2fa)
7. [Passkey Plugin](#7-passkey-plugin)
8. [Organization Plugin](#8-organization-plugin)
9. [Admin Plugin](#9-admin-plugin)
10. [Session Management](#10-session-management)
11. [Drizzle ORM Adapter](#11-drizzle-orm-adapter)
12. [Hooks](#12-hooks)
13. [Database Hooks & Additional Fields](#13-database-hooks--additional-fields)

---

## 1. Installation

### Package install
```bash
npm install better-auth
# For passkey plugin (separate package):
npm install @better-auth/passkey
```

### Server setup — `lib/auth/auth.ts`
```ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db" // your drizzle instance

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // "pg" | "mysql" | "sqlite"
  }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
})
```

### Next.js App Router — `app/api/auth/[...all]/route.ts`
```ts
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
export const { POST, GET } = toNextJsHandler(auth)
```

### Client — `lib/auth/auth-client.ts`
```ts
import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", // optional when same domain
})
// Or export specific methods:
export const { signIn, signUp, useSession } = createAuthClient()
```

### CLI commands
```bash
npx auth@latest generate   # generate ORM schema / SQL migration file
npx auth@latest migrate    # apply migrations directly (Kysely adapter only)
```

---

## 2. Environment Variables

```env
BETTER_AUTH_SECRET=<random-32-char-string>   # Required. At least 32 chars, high entropy.
BETTER_AUTH_URL=http://localhost:3000        # Base URL of your app

# OAuth providers
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/better_auth
```

---

## 3. TypeScript Integration

### Strict mode (required)
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true   // enables strictNullChecks
  }
}
```

> **Warning**: Do NOT enable `declaration` + `composite` together — causes type inference overflow.

### Infer session type
```ts
// From client
import { createAuthClient } from "better-auth/client"
const authClient = createAuthClient()
export type Session = typeof authClient.$Infer.Session
// Session has { session: {...}, user: {...} }

// From server
import { betterAuth } from "better-auth"
export const auth = betterAuth({ ... })
type Session = typeof auth.$Infer.Session
```

### Additional fields on user/session
```ts
export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,      // IMPORTANT: set false for server-only fields like role
        defaultValue: "user",
      }
    }
  }
})
```

### Infer additional fields on the client (same project)
```ts
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
})
```

### Infer additional fields on the client (separate project)
```ts
import { inferAdditionalFields } from "better-auth/client/plugins"
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({
    user: {
      role: { type: "string" }
    }
  })],
})
```

> **Security**: `input: false` prevents users from setting fields like `role` during sign-up. Always use it for privileged fields.

---

## 4. Email & Password Authentication

### Enable in server config
```ts
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,                    // required
    requireEmailVerification: false,  // default false
    disableSignUp: false,
    minPasswordLength: 8,             // default 8
    maxPasswordLength: 128,           // default 128
    autoSignIn: true,
    revokeSessionsOnPasswordReset: false,
    resetPasswordTokenExpiresIn: 3600, // seconds
    // callbacks:
    sendResetPassword: async ({ user, url, token }, request) => { /* send email */ },
    onPasswordReset: async ({ user }, request) => { /* post-reset logic */ },
    onExistingUserSignUp: async ({ user }, request) => { /* notify existing user */ },
  },
})
```

> **Note**: Avoid `await`-ing email sending in callbacks to prevent timing attacks. Use `waitUntil` on serverless.

### Client API — Sign Up
```ts
const { data, error } = await authClient.signUp.email({
  name: "John Doe",        // required
  email: "user@example.com", // required
  password: "password1234",  // required, 8–128 chars
  image: "https://...",     // optional
  callbackURL: "/",         // optional redirect after sign up
})
// POST /sign-up/email
```

### Client API — Sign In
```ts
const { data, error } = await authClient.signIn.email({
  email: "user@example.com", // required
  password: "password1234",  // required
  rememberMe: true,          // default true; false = sign out on browser close
  callbackURL: "/dashboard", // optional
})
// POST /sign-in/email
```

### Client API — Sign Out
```ts
await authClient.signOut()
// With redirect:
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => router.push("/login"),
  },
})
// POST /sign-out
```

### Client API — Request Password Reset
```ts
const { data, error } = await authClient.requestPasswordReset({
  email: "user@example.com",          // required
  redirectTo: "https://app.com/reset", // optional; token appended as ?token=...
})
// POST /request-password-reset
```

### Client API — Reset Password
```ts
const token = new URLSearchParams(window.location.search).get("token")
const { data, error } = await authClient.resetPassword({
  newPassword: "newpassword1234", // required
  token,                         // required
})
// POST /reset-password
```

### Client API — Change Password
```ts
const { data, error } = await authClient.changePassword({
  newPassword: "newpassword1234",  // required
  currentPassword: "oldpassword",  // required
  revokeOtherSessions: true,       // optional
})
// POST /change-password
```

### Email Verification setup
```ts
export const auth = betterAuth({
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      void sendEmail({ to: user.email, subject: "Verify email", text: `Click: ${url}` })
    },
  },
})
```

### Trigger email verification (client)
```ts
await authClient.sendVerificationEmail({
  email: "user@email.com",
  callbackURL: "/",
})
```

### Handle unverified email error
```ts
await authClient.signIn.email(
  { email, password },
  {
    onError: (ctx) => {
      if (ctx.error.status === 403) alert("Please verify your email")
    },
  }
)
```

### Custom password hashing (Argon2 example)
```ts
import { hash, verify } from "@node-rs/argon2"
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => hash(password, { algorithm: 2 }),
      verify: async ({ password, hash: h }) => verify(h, password, { algorithm: 2 }),
    },
  },
})
```

---

## 5. OAuth / Social Sign-On

### Server config
```ts
export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: ["email", "profile"],          // optional
      redirectURI: "https://app.com/...",   // optional custom
      disableSignUp: false,                  // optional
      overrideUserInfoOnSignIn: false,       // update user on each sign-in
      prompt: "select_account",             // "consent"|"login"|"none"|"select_account+consent"
      mapProfileToUser: (profile) => ({
        firstName: profile.given_name,
        lastName: profile.family_name,
      }),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },
})
```

### Client API — Sign In with Social
```ts
await authClient.signIn.social({
  provider: "google", // any configured provider id
  callbackURL: "/dashboard",
  additionalData: {    // passed through the OAuth state
    referralCode: "ABC123",
    source: "landing-page",
  },
})
```

### Client API — Link Social Account
```ts
await authClient.linkSocial({
  provider: "google",
  scopes: ["https://www.googleapis.com/auth/drive.file"], // optional extra scopes
})
```

### Client API — Get Access Token
```ts
const { accessToken } = await authClient.getAccessToken({
  providerId: "google",
  accountId: "...", // optional specific account
})
```

### Providers without email (mapProfileToUser fallback)
```ts
socialProviders: {
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    mapProfileToUser: (profile) => ({
      email: profile.email ?? `${profile.id}@discord.placeholder.local`,
    }),
  },
}
```

### Accessing OAuth state in hooks
```ts
import { getOAuthState } from "better-auth/api"
hooks: {
  after: createAuthMiddleware(async (ctx) => {
    if (ctx.path === "/callback/:id") {
      const data = await getOAuthState<{ referralCode?: string }>()
      // validate and use data.referralCode
    }
  }),
}
```

---

## 6. Two-Factor Authentication (2FA)

### Server setup
```ts
import { twoFactor } from "better-auth/plugins"
export const auth = betterAuth({
  appName: "My App", // used as TOTP issuer
  plugins: [
    twoFactor({
      issuer: "my-app-name",           // overrides appName for TOTP
      skipVerificationOnEnable: false,  // default false
      allowPasswordless: false,         // allow 2FA for passkey/magic-link users
      totpOptions: {
        digits: 6,    // default 6
        period: 30,   // default 30 seconds
      },
      otpOptions: {
        sendOTP: async ({ user, otp }, ctx) => {
          // send otp via email or SMS
        },
        period: 300, // OTP validity in seconds
      },
      backupCodeOptions: {
        amount: 10,   // number of backup codes
        length: 10,   // length of each code
      },
      // Account lockout (enabled by default)
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 600, // 10 minutes
      },
    }),
  ],
})
```

### Client setup
```ts
import { twoFactorClient } from "better-auth/client/plugins"
export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor",         // redirect URL (causes page reload)
      onTwoFactorRedirect({ twoFactorMethods }) {
        // twoFactorMethods: e.g. ["totp", "otp"]
        window.location.href = "/2fa"        // handle without page reload
      },
    }),
  ],
})
```

### Enable 2FA
```ts
const { data, error } = await authClient.twoFactor.enable({
  password: "secure-password",  // required for credential accounts
  issuer: "my-app-name",        // optional override
})
// Returns: { totpURI, backupCodes }
// Note: twoFactorEnabled stays false until user verifies TOTP
// POST /two-factor/enable
```

### Disable 2FA
```ts
await authClient.twoFactor.disable({ password })
// POST /two-factor/disable
```

### Get TOTP URI (for QR code)
```ts
const { data } = await authClient.twoFactor.getTotpUri({ password })
// data.totpURI — use with react-qr-code or similar
// POST /two-factor/get-totp-uri
```

### Verify TOTP code
```ts
const { data, error } = await authClient.twoFactor.verifyTotp({
  code: "012345",    // required
  trustDevice: true, // optional: trust for 30 days
})
// POST /two-factor/verify-totp
```

### Sign-in flow with 2FA
```ts
await authClient.signIn.email(
  { email, password },
  {
    onSuccess: (context) => {
      if (context.data.twoFactorRedirect) {
        const methods = context.data.twoFactorMethods // ["totp"] | ["totp","otp"]
        // redirect to 2FA verification page
      }
    },
  }
)
```

> **Important**: When 2FA challenge is issued, `ctx.context.newSession` is `null` in after hooks. Always null-check it.

### Send OTP (email/SMS)
```ts
const { data } = await authClient.twoFactor.sendOtp({ trustDevice: true })
// POST /two-factor/send-otp
```

### Verify OTP
```ts
const { data, error } = await authClient.twoFactor.verifyOtp({
  code: "012345",    // required
  trustDevice: true,
})
// POST /two-factor/verify-otp
```

### Backup codes — Generate
```ts
const { data } = await authClient.twoFactor.generateBackupCodes({ password })
// Returns new backup codes; old ones are deleted
// POST /two-factor/generate-backup-codes
```

### Backup codes — Use for login
```ts
const { data, error } = await authClient.twoFactor.verifyBackupCode({
  code: "123456",        // required
  disableSession: false, // if true, don't set session cookie
  trustDevice: true,
})
// POST /two-factor/verify-backup-code
```

### Backup codes — View (server only)
```ts
const data = await auth.api.viewBackupCodes({ body: { userId: "user-id" } })
```

### Database schema additions
- `user` table: `twoFactorEnabled` (boolean)
- `twoFactor` table: `id`, `userId` (FK), `secret`, `backupCodes`, `verified` (boolean), `failedVerificationCount` (number), `lockedUntil` (date|null)

---

## 7. Passkey Plugin

> Powered by [SimpleWebAuthn](https://simplewebauthn.dev/). Package: `@better-auth/passkey`

### Server setup
```ts
import { passkey } from "@better-auth/passkey"
export const auth = betterAuth({
  plugins: [
    passkey({
      rpID: "localhost",       // your domain
      rpName: "My App",
      origin: "http://localhost:3000",
      authenticatorSelection: {
        authenticatorAttachment: undefined, // "platform"|"cross-platform"|undefined
        residentKey: "preferred",           // "required"|"preferred"|"discouraged"
        userVerification: "preferred",      // "required"|"preferred"|"discouraged"
      },
      registration: {
        requireSession: true, // false for passkey-first (no password) onboarding
        resolveUser: async ({ ctx, context }) => { // required when requireSession: false
          return { id: "user-id", name: "user@example.com" }
        },
        extensions: { credProps: true },   // optional WebAuthn extensions
        afterVerification: async ({ verification }) => ({
          name: getAuthenticatorName(verification.registrationInfo?.aaguid),
        }),
      },
      authentication: {
        extensions: { credProps: true },
      },
      advanced: {
        webAuthnChallengeCookie: "better-auth-passkey", // default cookie name
      },
    }),
  ],
})
```

### Client setup
```ts
import { passkeyClient } from "@better-auth/passkey/client"
export const authClient = createAuthClient({
  plugins: [passkeyClient()],
})
```

### Register a passkey
```ts
const { data, error } = await authClient.passkey.addPasskey({
  name: "My Passkey",                    // optional label; defaults to email
  authenticatorAttachment: "platform",   // optional
  context: "signed-token",               // for passkey-first flows
})
// POST /passkey/add-passkey
// Note: errors always return as data.error, not thrown even with throw:true
```

### Sign in with passkey
```ts
const { data, error } = await authClient.signIn.passkey({
  autoFill: true, // browser autofill / Conditional UI
  extensions: { credProps: true },
  fetchOptions: {
    onSuccess(ctx) { window.location.href = "/dashboard" },
    onError(ctx) { console.error(ctx.error.message) },
  },
})
// POST /sign-in/passkey
```

### Conditional UI (passkey autofill)
```tsx
// Add autocomplete="username webauthn" to inputs
// <input type="text" autocomplete="username webauthn" />

// Preload on component mount:
useEffect(() => {
  if (!PublicKeyCredential.isConditionalMediationAvailable?.()) return
  void authClient.signIn.passkey({ autoFill: true })
}, [])
```

### List user's passkeys
```ts
const { data: passkeys } = await authClient.passkey.listUserPasskeys()
// GET /passkey/list-user-passkeys
```

### Name passkeys by authenticator
```ts
import { getAuthenticatorName, commonAuthenticatorNames } from "@better-auth/passkey"
const label = passkey.name || getAuthenticatorName(passkey.aaguid) || "Passkey"
// Extend the built-in map:
const names = { ...commonAuthenticatorNames, "custom-aaguid": "My Provider" }
```

### Delete a passkey
```ts
await authClient.passkey.deletePasskey({ id: "passkey-id" })
// POST /passkey/delete-passkey
```

### Update passkey name
```ts
await authClient.passkey.updatePasskey({ id: "passkey-id", name: "New Name" })
// POST /passkey/update-passkey
```

### Database schema
Table: `passkey` — `id` (PK), `name?`, `publicKey`, `userId` (FK), `credentialID`, `counter`, `deviceType`, `backedUp`, `transports?`, `createdAt?`, `aaguid?`

---

## 8. Organization Plugin

### Server setup
```ts
import { organization } from "better-auth/plugins"
export const auth = betterAuth({
  plugins: [
    organization({
      allowUserToCreateOrganization: true,  // boolean or async (user) => boolean
      organizationLimit: undefined,          // max orgs per user
      creatorRole: "owner",                  // "owner" | "admin"
      membershipLimit: 100,                  // max members per org
      invitationExpiresIn: 48 * 60 * 60,    // 48 hours (seconds)
      cancelPendingInvitationsOnReInvite: false,
      requireEmailVerificationOnInvitation: false, // true = strict
      sendInvitationEmail: async (data) => {
        const inviteLink = `https://app.com/accept-invitation/${data.id}`
        await sendEmail({ to: data.email, inviteLink })
      },
      disableOrganizationDeletion: false,
      teams: {
        enabled: false,
        maximumTeams: 10,               // or async fn
        maximumMembersPerTeam: 50,      // or async fn
        allowRemovingAllTeams: false,
      },
      // Custom access control
      ac,
      roles: { owner, admin, member, myCustomRole },
      // Organization lifecycle hooks
      organizationHooks: {
        beforeCreateOrganization: async ({ organization, user }) => ({ data: organization }),
        afterCreateOrganization: async ({ organization, member, user }) => {},
        beforeUpdateOrganization: async ({ organization, user, member }) => ({ data: organization }),
        afterUpdateOrganization: async ({ organization, user, member }) => {},
        beforeAddMember: async ({ member, user, organization }) => ({ data: member }),
        afterAddMember: async ({ member, user, organization }) => {},
        beforeRemoveMember: async ({ member, user, organization }) => {},
        afterRemoveMember: async ({ member, user, organization }) => {},
        beforeUpdateMemberRole: async ({ member, newRole, user, organization }) => ({ data: { role: newRole } }),
        afterUpdateMemberRole: async ({ member, previousRole, user, organization }) => {},
        beforeCreateInvitation: async ({ invitation, inviter, organization }) => ({ data: invitation }),
        afterCreateInvitation: async ({ invitation, inviter, organization }) => {},
        beforeAcceptInvitation: async ({ invitation, user, organization }) => {},
        afterAcceptInvitation: async ({ invitation, member, user, organization }) => {},
        beforeRejectInvitation: async ({ invitation, user, organization }) => {},
        afterRejectInvitation: async ({ invitation, user, organization }) => {},
        beforeCancelInvitation: async ({ invitation, cancelledBy, organization }) => {},
        afterCancelInvitation: async ({ invitation, cancelledBy, organization }) => {},
        // Team hooks (when teams.enabled: true):
        beforeCreateTeam: async ({ team, user, organization }) => ({ data: team }),
        afterCreateTeam: async ({ team, user, organization }) => {},
        beforeDeleteTeam: async ({ team, user, organization }) => {},
        afterDeleteTeam: async ({ team, user, organization }) => {},
        beforeAddTeamMember: async ({ teamMember, team, user, organization }) => {},
        afterAddTeamMember: async ({ teamMember, team, user, organization }) => {},
      },
    }),
  ],
})
```

### Client setup
```ts
import { organizationClient } from "better-auth/client/plugins"
export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: { owner, admin, member, myCustomRole },
      teams: { enabled: true }, // if using teams
    }),
  ],
})
```

### Organization CRUD (client)
```ts
// Create
const { data } = await authClient.organization.create({
  name: "My Org",   // required
  slug: "my-org",   // required
  logo: "https://...",
  metadata: { customField: "value" },
})
// POST /organization/create

// List user's orgs
const { data: orgs } = await authClient.organization.list()
// GET /organization/list

// Set active org
await authClient.organization.setActive({ organizationId: "org-id" })
// POST /organization/set-active

// Get full org details
const { data: org } = await authClient.organization.getFullOrganization({
  query: { organizationId: "org-id", membersLimit: 100 },
})
// GET /organization/get-full-organization

// Update
await authClient.organization.update({
  data: { name: "New Name", slug: "new-slug", logo: "...", metadata: {} },
  organizationId: "org-id",
})
// POST /organization/update

// Delete
await authClient.organization.delete({ organizationId: "org-id" })
// POST /organization/delete
```

### Active organization hooks (React)
```tsx
const { data: activeOrg } = authClient.useActiveOrganization()
const { data: orgs } = authClient.useListOrganizations()
```

### Invitations
```ts
// Invite member
await authClient.organization.inviteMember({
  email: "user@example.com",  // required
  role: "member",              // required: "owner"|"admin"|"member" or custom
  organizationId: "org-id",
  resend: true,
  teamId: "team-id",           // optional if teams enabled
})
// POST /organization/invite-member

// Accept invitation (user must be logged in)
await authClient.organization.acceptInvitation({ invitationId: "inv-id" })
// POST /organization/accept-invitation

// Cancel invitation
await authClient.organization.cancelInvitation({ invitationId: "inv-id" })
// POST /organization/cancel-invitation

// Reject invitation
await authClient.organization.rejectInvitation({ invitationId: "inv-id" })
// POST /organization/reject-invitation

// Get invitation
const { data } = await authClient.organization.getInvitation({ query: { id: "inv-id" } })
// GET /organization/get-invitation

// List org invitations
const { data } = await authClient.organization.listInvitations({
  query: { organizationId: "org-id" },
})
// GET /organization/list-invitations

// List user's pending invitations
const invitations = await authClient.organization.listUserInvitations()
```

### Members
```ts
// List members
const { data } = await authClient.organization.listMembers({
  query: {
    organizationId: "org-id",
    limit: 100,
    offset: 0,
    sortBy: "createdAt",
    sortDirection: "desc",
    filterField: "role",
    filterOperator: "eq",
    filterValue: "admin",
  },
})
// GET /organization/list-members

// Remove member
await authClient.organization.removeMember({
  memberIdOrEmail: "user@example.com",  // required
  organizationId: "org-id",
})
// POST /organization/remove-member

// Update member role
await authClient.organization.updateMemberRole({
  role: ["admin", "sale"],   // required
  memberId: "member-id",     // required
  organizationId: "org-id",
})
// POST /organization/update-member-role

// Get active member
const { data: member } = await authClient.organization.getActiveMember()
// GET /organization/get-active-member

// Get active member role
const { data: { role } } = await authClient.organization.getActiveMemberRole()
// GET /organization/get-active-member-role

// Add member directly (server only, no invitation)
const data = await auth.api.addMember({
  body: {
    userId: "user-id",
    role: ["admin"],     // required
    organizationId: "org-id",
    teamId: "team-id",   // optional
  },
})

// Leave organization
await authClient.organization.leave({ organizationId: "org-id" })
// POST /organization/leave
```

### Access Control
```ts
// permissions.ts
import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements, adminAc } from "better-auth/plugins/organization/access"

const statement = {
  ...defaultStatements,
  project: ["create", "share", "update", "delete"],
} as const

const ac = createAccessControl(statement)
const member = ac.newRole({ project: ["create"] })
const admin = ac.newRole({ project: ["create", "update"], ...adminAc.statements })
const owner = ac.newRole({ project: ["create", "update", "delete"] })
const myCustomRole = ac.newRole({ project: ["create", "update", "delete"], organization: ["update"] })
```

### Check permissions
```ts
// Server
await auth.api.hasPermission({
  headers: await headers(),
  body: { permissions: { project: ["create"] } },
})

// Client
const canCreate = await authClient.organization.hasPermission({
  permissions: { project: ["create"] },
})

// Synchronous client check (no server call)
const hasAccess = authClient.organization.checkRolePermission({
  permissions: { organization: ["delete"] },
  role: "admin",
})
```

### Teams
```ts
// Create team
await authClient.organization.createTeam({ name: "my-team", organizationId: "org-id" })
// POST /organization/create-team

// List teams
await authClient.organization.listTeams({ query: { organizationId: "org-id" } })
// GET /organization/list-teams

// Add/remove team members
await authClient.organization.addTeamMember({ teamId: "team-id", userId: "user-id" })
await authClient.organization.removeTeamMember({ teamId: "team-id", userId: "user-id" })
await authClient.organization.setActiveTeam({ teamId: "team-id" }) // null to unset
await authClient.organization.listUserTeams()
await authClient.organization.listTeamMembers({ query: { teamId: "team-id" } })
```

### Database schema
- `organization`: `id`, `name`, `slug`, `logo?`, `metadata?`, `createdAt`
- `member`: `id`, `userId` (FK), `organizationId` (FK), `role`, `createdAt`
- `invitation`: `id`, `email`, `inviterId` (FK), `organizationId` (FK), `role?`, `status`, `createdAt`, `expiresAt`, `teamId?` (if teams enabled)
- `session` additions: `activeOrganizationId?`, `activeTeamId?`
- `organizationRole` (if dynamicAccessControl enabled): `id`, `organizationId`, `role`, `permission`, `createdAt`, `updatedAt?`
- `team` (if teams enabled): `id`, `name`, `organizationId`, `createdAt`, `updatedAt?`
- `teamMember` (if teams enabled): `id`, `teamId`, `userId`, `createdAt?`

---

## 9. Admin Plugin

### Server setup
```ts
import { admin } from "better-auth/plugins"
export const auth = betterAuth({
  plugins: [
    admin({
      defaultRole: "user",               // default role for new users
      adminRoles: ["admin"],             // which roles count as admin
      adminUserIds: ["user_id_1"],       // specific users always treated as admin
      impersonationSessionDuration: 3600, // seconds (default 1 hour)
      defaultBanReason: "No reason",
      defaultBanExpiresIn: undefined,    // undefined = never expires
      bannedUserMessage: "You have been banned...",
      // Custom access control
      ac,
      roles: { admin, user, myCustomRole },
    }),
  ],
})
```

### Client setup
```ts
import { adminClient } from "better-auth/client/plugins"
export const authClient = createAuthClient({
  plugins: [adminClient({ ac, roles: { admin, user, myCustomRole } })],
})
```

### User management (client)
```ts
// Create user
const { data: newUser } = await authClient.admin.createUser({
  email: "user@example.com",  // required
  password: "secure-password", // required
  name: "James Smith",         // required
  role: "user",                // optional
  data: { customField: "value" }, // additional fields
})
// POST /admin/create-user

// List users (with filtering, pagination, sorting)
const { data: users } = await authClient.admin.listUsers({
  query: {
    searchValue: "john",
    searchField: "name",   // "name" | "email"
    searchOperator: "contains", // "contains"|"starts_with"|"ends_with"
    limit: 100,
    offset: 0,
    sortBy: "createdAt",
    sortDirection: "desc",  // "asc" | "desc"
    filterField: "email",
    filterValue: "hello@example.com",
    filterOperator: "eq",   // "eq"|"ne"|"lt"|"lte"|"gt"|"gte"|"in"|"not_in"|"contains"|"starts_with"|"ends_with"
  },
})
// Response: { users: User[], total: number, limit?: number, offset?: number }
// GET /admin/list-users

// Get user
const { data, error } = await authClient.admin.getUser({ query: { id: "user-id" } })
// GET /admin/get-user

// Update user
await authClient.admin.updateUser({ userId: "user-id", data: { name: "New Name" } })
// POST /admin/update-user

// Set role
await authClient.admin.setRole({ userId: "user-id", role: "admin" })
// POST /admin/set-role

// Set password
await authClient.admin.setUserPassword({ newPassword: "...", userId: "user-id" })
// POST /admin/set-user-password

// Delete user (hard delete)
await authClient.admin.removeUser({ userId: "user-id" })
// POST /admin/remove-user
```

### Ban / Unban
```ts
await authClient.admin.banUser({
  userId: "user-id",  // required
  banReason: "Spamming",
  banExpiresIn: 60 * 60 * 24 * 7, // 1 week in seconds; undefined = permanent
})
// POST /admin/ban-user

await authClient.admin.unbanUser({ userId: "user-id" })
// POST /admin/unban-user
```

### Session management
```ts
// List sessions for a user
const { data } = await authClient.admin.listUserSessions({ userId: "user-id" })
// POST /admin/list-user-sessions

// Revoke specific session
await authClient.admin.revokeUserSession({ sessionToken: "token" })
// POST /admin/revoke-user-session

// Revoke ALL sessions for a user
await authClient.admin.revokeUserSessions({ userId: "user-id" })
// POST /admin/revoke-user-sessions
```

### Impersonation
```ts
// Start impersonating
const { data } = await authClient.admin.impersonateUser({ userId: "user-id" })
// POST /admin/impersonate-user
// Session expires after impersonationSessionDuration (default 1h)

// Stop impersonating
await authClient.admin.stopImpersonating()
// POST /admin/stop-impersonating
```

### Permission checking
```ts
// Client
const canDeleteUser = await authClient.admin.hasPermission({
  userId: "user-id",
  permissions: { user: ["delete"] },
})

// Client — synchronous role check
const hasDelete = authClient.admin.checkRolePermission({
  permissions: { user: ["delete"] },
  role: "admin",
})

// Server
await auth.api.userHasPermission({
  body: {
    userId: "user-id",      // or role: "admin"
    permissions: { project: ["create"] },
  },
})
```

### Default roles and permissions
- `admin`: full control over `user` (create, list, set-role, ban, impersonate, delete, set-password, set-email, get, update) and `session` (list, revoke, delete)
- `user`: no admin permissions

### Database schema additions
- `user` table: `role?` (string, default "user"), `banned?` (boolean), `banReason?` (string), `banExpires?` (date)
- `session` table: `impersonatedBy?` (string — admin's user ID)

### Email enumeration protection with admin plugin
```ts
// When requireEmailVerification: true, add admin fields to customSyntheticUser:
emailAndPassword: {
  requireEmailVerification: true,
  customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
    ...coreFields,
    // Admin plugin fields (in schema order):
    role: "user",
    banned: false,
    banReason: null,
    banExpires: null,
    ...additionalFields,
    id,
  }),
},
plugins: [admin()],
```

---

## 10. Session Management

### Session table fields
`id`, `token`, `userId`, `expiresAt`, `ipAddress`, `userAgent`

### Session configuration
```ts
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days (default)
    updateAge: 60 * 60 * 24,       // refresh expiry every 1 day (default)
    freshAge: 60 * 60 * 24,        // session is "fresh" if < 1 day old (default)
    disableSessionRefresh: false,   // disable automatic refresh
    deferSessionRefresh: false,     // GET becomes read-only; client calls POST to refresh
    // Cookie cache to avoid DB hit on every useSession/getSession:
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,              // 5 minutes
      strategy: "compact",          // "compact" (default) | "jwt" | "jwe"
      version: "1",                 // change to invalidate all cached sessions
      refreshCache: false,          // true = auto-refresh at 80% of maxAge
    },
    // Secondary storage (Redis etc.) options:
    storeSessionInDatabase: false,  // store in DB instead of secondary storage
    preserveSessionInDatabase: false,
  },
})
```

### Cookie cache strategies
| Strategy  | Size     | Security                  | JWT compatible |
| --------- | -------- | ------------------------- | -------------- |
| `compact` | Smallest | Signed (HMAC-SHA256)      | No             |
| `jwt`     | Medium   | Signed (HS256)            | Yes            |
| `jwe`     | Largest  | Encrypted (A256CBC-HS512) | No             |

### Client session API
```ts
// Get session (one-time)
const { data: session } = await authClient.getSession()

// Reactive session (React hook)
const { data: session } = authClient.useSession()

// List all active sessions
const sessions = await authClient.listSessions()

// Revoke a specific session by token
await authClient.revokeSession({ token: "session-token" })

// Revoke all other sessions
await authClient.revokeOtherSessions()

// Revoke all sessions
await authClient.revokeSessions()

// Update session additional fields
await authClient.updateSession({ theme: "dark", language: "en" })
// Core fields (token, userId, expiresAt, etc.) cannot be updated here.
```

### Force fresh DB lookup (bypass cookie cache)
```ts
const session = await authClient.getSession({ query: { disableCookieCache: true } })
```

### Customize session response
```ts
import { customSession } from "better-auth/plugins"
export const auth = betterAuth({
  plugins: [
    customSession(async ({ user, session }) => {
      const roles = await findUserRoles(session.session.userId)
      return {
        roles,
        user: { ...user, newField: "value" },
        session,
      }
    }),
  ],
})
```

Client-side inference for custom session:
```ts
import { customSessionClient } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"
const authClient = createAuthClient({
  plugins: [customSessionClient<typeof auth>()],
})
```

### Stateless sessions (no database)
```ts
export const auth = betterAuth({
  // No database config — stateless auto-enabled
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60,
      strategy: "jwe",
      refreshCache: true,
    },
  },
  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },
})
```

---

## 11. Drizzle ORM Adapter

### Installation
```bash
# The adapter is built into better-auth (no separate install for built-in):
import { drizzleAdapter } from "better-auth/adapters/drizzle"

# Or the standalone package:
npm install @better-auth/drizzle-adapter
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
```

### Basic usage
```ts
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./database"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",    // "pg" | "mysql" | "sqlite"
    schema,            // optional: pass your drizzle schema
    usePlural: false,  // true if all tables use plural names (users, sessions, etc.)
  }),
})
```

### Plural table names
```ts
database: drizzleAdapter(db, { provider: "pg", usePlural: true })
// OR per-model:
user: { modelName: "users" }
```

### Custom field/table name mapping
```ts
database: drizzleAdapter(db, {
  provider: "pg",
  schema: {
    ...schema,
    user: schema.users, // map "user" table to "users"
  },
}),
// OR:
user: {
  fields: { email: "email_address" }, // map email field to email_address column
}
```

### Experimental joins (2–3x perf improvement)
```ts
export const auth = betterAuth({
  experimental: { joins: true },
})
// Requires Drizzle relations to be defined in your schema
// Regenerate schema with: npx auth@latest generate
```

### Schema generation
```bash
npx auth@latest generate           # generate Drizzle schema + migration
npx drizzle-kit generate           # generate migration from schema diff
npx drizzle-kit migrate            # apply migration
```

---

## 12. Hooks

Hooks let you add custom logic to Better Auth endpoint lifecycle without building a plugin.

### Before hooks (modify request or return early)
```ts
import { createAuthMiddleware, APIError } from "better-auth/api"

export const auth = betterAuth({
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Enforce email domain restriction
      if (ctx.path === "/sign-up/email" && !ctx.body?.email.endsWith("@example.com")) {
        throw new APIError("BAD_REQUEST", { message: "Email must end with @example.com" })
      }
      // Modify request body
      if (ctx.path === "/sign-up/email") {
        return {
          context: {
            ...ctx,
            body: { ...ctx.body, name: "Forced Name" },
          }
        }
      }
    }),
  },
})
```

### After hooks (react to or modify response)
```ts
hooks: {
  after: createAuthMiddleware(async (ctx) => {
    if (ctx.path.startsWith("/sign-up")) {
      const newSession = ctx.context.newSession
      if (newSession) {
        // Fire and forget — don't await to avoid blocking response
        ctx.context.runInBackground(sendAnalyticsEvent(newSession.user.id))
        // Or await but defer to background handler if configured:
        await ctx.context.runInBackgroundOrAwait(sendWelcomeEmail(newSession.user))
      }
    }
    if (ctx.path === "/sign-in/email") {
      // track login analytics
    }
  }),
}
// Note: each hook (before/after) takes ONE middleware. Branch on ctx.path for multiple endpoints.
```

### ctx object reference
| Property                                      | Description                                                        |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `ctx.path`                                    | Current endpoint path                                              |
| `ctx.body`                                    | Parsed request body (POST)                                         |
| `ctx.headers`                                 | Request headers                                                    |
| `ctx.request`                                 | Raw request object                                                 |
| `ctx.query`                                   | Query parameters                                                   |
| `ctx.context.newSession`                      | Newly created session (after hooks only)                           |
| `ctx.context.returned`                        | Return value from hook chain                                       |
| `ctx.context.responseHeaders`                 | Response headers set so far                                        |
| `ctx.context.authCookies`                     | Better Auth's predefined cookie config                             |
| `ctx.context.secret`                          | Auth instance secret                                               |
| `ctx.context.password`                        | `{ hash, verify }`                                                 |
| `ctx.context.adapter`                         | `{ findOne, findMany, create, update, updateMany, delete }`        |
| `ctx.context.internalAdapter`                 | Higher-level: `createUser`, `createSession`, `updateSession`, etc. |
| `ctx.context.generateId`                      | ID generator function                                              |
| `ctx.context.runInBackground(promise)`        | Fire-and-forget after response                                     |
| `ctx.context.runInBackgroundOrAwait(promise)` | Defer if handler configured, else await                            |

### Response utilities in hooks
```ts
// JSON response
return ctx.json({ message: "Hello World" })
// Redirect
throw ctx.redirect("/sign-up/name")
// Set cookies
ctx.setCookie("my-cookie", "value")
await ctx.setSignedCookie("signed-cookie", "value", ctx.context.secret, { maxAge: 1000 })
// Error
throw new APIError("BAD_REQUEST", { message: "Invalid request" })
```

---

## 13. Database Hooks & Additional Fields

### Database hooks (low-level model lifecycle)
```ts
export const auth = betterAuth({
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // modify or reject user before creation
          return { data: { ...user, role: "user" } }
        },
        after: async (user) => {
          // react after user creation
          await sendWelcomeEmail(user.email)
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // e.g., set initial active organization
          const org = await getInitialOrganization(session.userId)
          return { data: { ...session, activeOrganizationId: org?.id } }
        },
      },
    },
  },
})
```

### Additional fields — full example
```ts
export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: "string",       // "string" | "number" | "boolean" | "date"
        input: false,          // prevent users from setting this
        returned: true,        // include in responses (default true)
        required: false,
        defaultValue: "user",
      },
      bio: {
        type: "string",
        input: true,           // allow users to set on sign-up/update
        required: false,
      },
    },
  },
  session: {
    additionalFields: {
      theme: { type: "string" },
    },
  },
})
```

### nextCookies plugin (for Next.js server actions)
```ts
import { nextCookies } from "better-auth/next-js"
export const auth = betterAuth({
  plugins: [nextCookies()],
})
// Allows auth to work from Next.js server actions without manual cookie forwarding
```

---

## Summary of Key API Endpoints

| Endpoint                            | Method | Description                     |
| ----------------------------------- | ------ | ------------------------------- |
| `/sign-up/email`                    | POST   | Register with email/password    |
| `/sign-in/email`                    | POST   | Sign in with email/password     |
| `/sign-in/passkey`                  | POST   | Sign in with passkey            |
| `/sign-out`                         | POST   | Sign out                        |
| `/request-password-reset`           | POST   | Send password reset email       |
| `/reset-password`                   | POST   | Reset password with token       |
| `/change-password`                  | POST   | Change password (authenticated) |
| `/send-verification-email`          | POST   | Send email verification         |
| `/get-session`                      | GET    | Get current session             |
| `/list-sessions`                    | GET    | List all user sessions          |
| `/revoke-session`                   | POST   | Revoke specific session         |
| `/two-factor/enable`                | POST   | Enable 2FA                      |
| `/two-factor/disable`               | POST   | Disable 2FA                     |
| `/two-factor/verify-totp`           | POST   | Verify TOTP code                |
| `/two-factor/verify-otp`            | POST   | Verify email/SMS OTP            |
| `/two-factor/verify-backup-code`    | POST   | Verify backup code              |
| `/two-factor/generate-backup-codes` | POST   | Regenerate backup codes         |
| `/passkey/add-passkey`              | POST   | Register a passkey              |
| `/passkey/list-user-passkeys`       | GET    | List user's passkeys            |
| `/passkey/delete-passkey`           | POST   | Delete a passkey                |
| `/organization/create`              | POST   | Create organization             |
| `/organization/list`                | GET    | List user's organizations       |
| `/organization/invite-member`       | POST   | Invite member                   |
| `/organization/accept-invitation`   | POST   | Accept invitation               |
| `/admin/list-users`                 | GET    | List all users (admin)          |
| `/admin/ban-user`                   | POST   | Ban user                        |
| `/admin/impersonate-user`           | POST   | Impersonate user                |

---

## Core Database Schema

### Core tables (all setups)

**user**: `id` (PK), `name`, `email` (unique), `emailVerified` (bool, default false), `image?`, `createdAt`, `updatedAt`

**session**: `id` (PK), `expiresAt`, `token` (unique), `createdAt`, `updatedAt`, `ipAddress?`, `userAgent?`, `userId` (FK)

**account**: `id` (PK), `accountId`, `providerId`, `userId` (FK), `accessToken?`, `refreshToken?`, `idToken?`, `accessTokenExpiresAt?`, `refreshTokenExpiresAt?`, `scope?`, `password?`, `createdAt`, `updatedAt`

**verification**: `id` (PK), `identifier`, `value`, `expiresAt`, `createdAt?`, `updatedAt?`

### Plugin-added tables
- **twoFactor** (2FA plugin): `id`, `secret`, `backupCodes`, `userId` (FK), `verified`, `failedVerificationCount`, `lockedUntil?`
- **passkey** (Passkey plugin): `id`, `name?`, `publicKey`, `userId` (FK), `credentialID`, `counter`, `deviceType`, `backedUp`, `transports?`, `createdAt?`, `aaguid?`
- **organization**, **member**, **invitation** (Organization plugin)
- **team**, **teamMember** (Organization plugin, teams enabled)

### Plugin-added user fields
- Admin: `role?`, `banned?`, `banReason?`, `banExpires?`
- Admin session: `impersonatedBy?`
- 2FA user: `twoFactorEnabled?`
- Organization session: `activeOrganizationId?`, `activeTeamId?` (if teams)
