import z from "zod";

/**
 * Validation schema for password confirmation when managing two-factor authentication.
 * Used to verify the user's password prior to enabling or disabling 2FA via the Better Auth Two-Factor plugin.
 * Ensures a non-empty password is submitted to authorize sensitive security modifications.
 *
 * @author Maruf Bepary
 */
export const twoFactorAuthSchema = z.object({
  password: z.string().min(1),
});

/**
 * Inferred TypeScript type representing valid two-factor management confirmation form values.
 * Used for typed form state and submission handling in 2FA toggle/security components.
 *
 * @author Maruf Bepary
 */
export type TwoFactorAuthForm = z.infer<typeof twoFactorAuthSchema>;
