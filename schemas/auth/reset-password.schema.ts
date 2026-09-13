import z from "zod";

/**
 * Validation schema for submitting a new password during account recovery.
 * Used during the password reset confirmation flow via Better Auth resetPassword API.
 * Enforces a minimum password length of 6 characters before updating the credential record.
 *
 * @author Maruf Bepary
 */
export const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

/**
 * Inferred TypeScript type representing valid reset-password form values.
 * Used for typed form state and submission handling in password reset components.
 *
 * @author Maruf Bepary
 */
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
