import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";

/**
 * Access control manager configured with default admin permission statements.
 * Serves as the central authorization schema provider for defining roles and validating
 * administrative permissions across server and client Better Auth plugins.
 *
 * @see {@link https://docs.better-auth.com/plugins/admin#access-control}
 * @author Maruf Bepary
 */
export const ac = createAccessControl(defaultStatements);

/**
 * Customised standard user role definition.
 * Inherits base user access statements while extending permissions to allow listing user records
 * for directory browsing and invitation lookups.
 *
 * @see ac
 * @author Maruf Bepary
 */
export const user = ac.newRole({
  ...userAc.statements,
  user: [...userAc.statements.user, "list"],
});

/**
 * Comprehensive administrator role definition.
 * Grants elevated privileges based on default Better Auth admin statements, including user management,
 * role assignment, session revocation, and impersonation.
 *
 * @see ac
 * @author Maruf Bepary
 */
export const admin = ac.newRole(adminAc.statements);
