import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { INVITATION_STATUS, ORG_ROLES } from "@/lib/auth/roles";

/**
 * Database table storing core user identities, authentication states, and custom profile attributes.
 * Represents the central identity entity managed by Better Auth, augmented with admin plugin fields
 * (role, ban status, ban expiration) and two-factor enablement flags, alongside application-specific
 * fields such as favoriteNumber.
 * Enforces email uniqueness and serves as the primary key reference for cascading deletions across
 * sessions, accounts, credentials, and memberships.
 *
 * @author Maruf Bepary
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  favoriteNumber: integer("favorite_number").notNull(),
});

/**
 * Database table tracking active user sessions and device telemetry.
 * Managed by Better Auth session management lifecycle, supporting multi-device login,
 * admin impersonation tracking (impersonatedBy), and organization tenant context (activeOrganizationId).
 * References the user table with cascading deletion on user removal, and enforces unique session tokens.
 *
 * @author Maruf Bepary
 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
  activeOrganizationId: text("active_organization_id"),
});

/**
 * Database table storing external OAuth provider credentials and local password hashes.
 * Managed by Better Auth core authentication to link third-party identity providers (e.g., GitHub, Google)
 * and credential-based accounts to a single user identity. Holds encrypted provider access tokens,
 * refresh tokens, expiration timestamps, and password hashes.
 * References the user table with cascading deletion to prune authentication secrets when a user is deleted.
 *
 * @author Maruf Bepary
 */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Database table storing temporary one-time verification tokens and challenge nonces.
 * Managed by Better Auth for critical asynchronous verification flows including email verification,
 * password reset requests, and change-email confirmations.
 * Identified by an arbitrary identifier (such as an email address) paired with a hashed or random value
 * and strict expiration timestamp.
 *
 * @author Maruf Bepary
 */
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Database table storing two-factor authentication (2FA) secrets, backup codes, and lockout counters.
 * Backed by the Better Auth Two-Factor plugin to support Time-based One-Time Password (TOTP) workflows.
 * Stores base32-encoded shared secrets, encrypted/hashed backup codes, failed attempt counts, and lockout timestamps
 * to guard against brute-force attacks.
 * References the user table with cascading deletion when a user is removed.
 *
 * @author Maruf Bepary
 */
export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  verified: boolean("verified").default(true),
  failedVerificationCount: integer("failed_verification_count").default(0),
  lockedUntil: timestamp("locked_until"),
});

/**
 * Database table storing FIDO2 / WebAuthn public key credentials for passwordless and multi-factor authentication.
 * Backed by the Better Auth Passkey plugin to manage WebAuthn credentials, attestation metadata (AAGUID),
 * public keys, credential IDs, sign count counters (to detect cloned authenticators), and backup flags.
 * References the user table with cascading deletion when a user account is deleted.
 *
 * @author Maruf Bepary
 */
export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  credentialID: text("credential_id").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  createdAt: timestamp("created_at"),
  aaguid: text("aaguid"),
});

/**
 * Database table defining multi-tenant organizations and workspaces.
 * Backed by the Better Auth Organization plugin to enable multi-tenant collaboration, team workspaces,
 * slug-based routing, and custom organization metadata.
 * Serves as the top-level boundary for member role associations and team invitations.
 *
 * @author Maruf Bepary
 */
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

/**
 * Database table mapping users to organizations with assigned role permissions.
 * Backed by the Better Auth Organization plugin to manage organizational membership and Role-Based Access Control (RBAC).
 * Supports default roles (e.g. member, admin, owner) to govern tenant resource access.
 * Maintains referential integrity with cascading deletion on both user and organization removal.
 *
 * @author Maruf Bepary
 */
export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").default(ORG_ROLES.MEMBER).notNull(),
  createdAt: timestamp("created_at").notNull(),
});

/**
 * Database table tracking pending and processed invitations to join an organization.
 * Backed by the Better Auth Organization plugin to manage invite lifecycles sent via email with expiration limits.
 * Tracks target email, assigned organization role, invitation status (pending, accepted, rejected, canceled),
 * and links to the inviting user and target organization with cascading deletion.
 *
 * @author Maruf Bepary
 */
export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").default(INVITATION_STATUS.PENDING).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
