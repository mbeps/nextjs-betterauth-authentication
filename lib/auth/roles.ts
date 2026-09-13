/**
 * Global system roles recognised by the Better Auth admin plugin.
 * Used for platform-wide role-based access control, privilege evaluation,
 * and restricting administrative routes and operations.
 *
 * @author Maruf Bepary
 */
export const GLOBAL_ROLES = {
  /** Platform superuser with unrestricted access to manage users, sessions, and system configuration. */
  ADMIN: "admin",
  /** Standard user with basic application access and individual profile management rights. */
  USER: "user",
} as const;

/**
 * Tenant-scoped membership roles for the Better Auth organization plugin.
 * Defines access tiers within individual organizations, governing member invites, role assignments,
 * and tenant resource manipulation.
 *
 * @author Maruf Bepary
 */
export const ORG_ROLES = {
  /** Organization owner with full billing, administrative, and deletion authority over the tenant. */
  OWNER: "owner",
  /** Organization administrator capable of inviting members and managing organization settings. */
  ADMIN: "admin",
  /** Standard organization member with basic team access and collaboration privileges. */
  MEMBER: "member",
} as const;

/**
 * Lifecycle states for organization membership invitations.
 * Governs invitation validity during email dispatch, acceptance, and cancellation flows.
 *
 * @author Maruf Bepary
 */
export const INVITATION_STATUS = {
  /** Invitation has been issued and is awaiting response from the invited recipient. */
  PENDING: "pending",
  /** Invitation was approved by the recipient and converted into active organization membership. */
  ACCEPTED: "accepted",
  /** Invitation was declined by the invited recipient. */
  REJECTED: "rejected",
  /** Invitation was revoked by an organization administrator prior to acceptance. */
  CANCELED: "canceled",
} as const;
