import z from "zod";

/**
 * Validation schema for authenticated password modification requests.
 * Used when a logged-in user changes their password via Better Auth changePassword API.
 * Requires the existing password for verification, enforces a minimum of 6 characters for the new password,
 * and accepts a revokeOtherSessions flag to optionally invalidate all other active sessions across devices.
 *
 * @author Maruf Bepary
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  revokeOtherSessions: z.boolean(),
});

/**
 * Inferred TypeScript type representing valid change-password form values.
 * Used for typed form state and submission handling in password settings components.
 *
 * @author Maruf Bepary
 */
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
