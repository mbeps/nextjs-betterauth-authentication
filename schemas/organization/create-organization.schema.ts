import z from "zod";

/**
 * Validation schema for new organization creation requests.
 * Used when establishing a multi-tenant workspace via the Better Auth Organization plugin.
 * Enforces a non-empty organization name before generating the organization record and assigning the creator as owner.
 *
 * @author Maruf Bepary
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(1),
});

/**
 * Inferred TypeScript type representing valid organization creation form values.
 * Used for typed form state and submission handling in organization creation dialogs.
 *
 * @author Maruf Bepary
 */
export type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;
