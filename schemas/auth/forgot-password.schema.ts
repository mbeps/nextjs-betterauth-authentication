import z from "zod";

/**
 * Validation schema for requesting a password reset email.
 * Used during the account recovery flow via Better Auth forgetPassword API.
 * Enforces a valid email format to locate the corresponding user account and dispatch a reset token.
 *
 * @author Maruf Bepary
 */
export const forgotPasswordSchema = z.object({
  email: z.email().min(1),
});

/**
 * Inferred TypeScript type representing valid forgot-password form values.
 * Used for typed form state and submission handling in password recovery components.
 *
 * @author Maruf Bepary
 */
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
