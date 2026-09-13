/**
 * Base path for authentication-related pages.
 */
const AUTH_ROOT = "/auth";

/**
 * Base path for organization-related pages and dashboards.
 */
const ORGANIZATIONS_ROOT = "/organizations";

/**
 * Centralised route registry defining application navigation paths.
 * Consolidates static route paths and dynamic route generation functions to avoid hardcoded
 * path strings across components, middleware, and redirects.
 *
 * @author Maruf Bepary
 */
export const ROUTES = {
  /** Landing page / root application route. */
  HOME: "/",
  /** Restricted administrative management dashboard route. */
  ADMIN: "/admin",
  /** User account settings and security management route. */
  PROFILE: "/profile",
  /** Authentication and session workflow routes. */
  AUTH: {
    /** User login and sign-up page. */
    LOGIN: `${AUTH_ROOT}/login`,
    /** Two-factor authentication verification challenge page. */
    TWO_FACTOR: `${AUTH_ROOT}/2fa`,
    /** Password reset confirmation and entry page. */
    RESET_PASSWORD: `${AUTH_ROOT}/reset-password`,
  },
  /** Multi-tenant organization management and invitation routes. */
  ORGANIZATIONS: {
    /** Primary organization dashboard overview route. */
    DASHBOARD: ORGANIZATIONS_ROOT,
    /**
     * Dynamic route generator for organization invitation acceptance pages.
     *
     * @param id - Unique organization invitation identifier
     * @returns Fully qualified invitation acceptance route string
     */
    INVITE: (id: string) => `${ORGANIZATIONS_ROOT}/invites/${id}`,
  },
} as const;

/**
 * Type representation of the centralised application route dictionary.
 *
 * @see ROUTES
 * @author Maruf Bepary
 */
export type Routes = typeof ROUTES;
