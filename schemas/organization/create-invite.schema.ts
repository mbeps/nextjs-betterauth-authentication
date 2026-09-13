import z from "zod";
import { ORG_ROLES } from "@/lib/auth/roles";

/**
 * Validation schema for inviting new members to an organization.
 * Used by organization administrators to dispatch email invitations via the Better Auth Organization plugin.
 * Trims whitespace and validates the recipient email format, and restricts assignable roles to either MEMBER or ADMIN.
 *
 * @author Maruf Bepary
 */
export const createInviteSchema = z.object({
  email: z.email().min(1).trim(),
  role: z.enum([ORG_ROLES.MEMBER, ORG_ROLES.ADMIN]),
});

/**
 * Inferred TypeScript type representing valid organization invite form values.
 * Used for typed form state and submission handling in member invitation modals.
 *
 * @author Maruf Bepary
 */
export type CreateInviteForm = z.infer<typeof createInviteSchema>;
