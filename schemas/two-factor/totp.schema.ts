import z from "zod";

/**
 * Validation schema for Time-based One-Time Password (TOTP) verification.
 * Used during two-factor authentication sign-in challenges and initial authenticator app setup
 * via the Better Auth Two-Factor plugin.
 * Enforces an exact 6-character length corresponding to standard TOTP RFC 6238 codes.
 *
 * @author Maruf Bepary
 */
export const totpSchema = z.object({
  code: z.string().length(6),
});

/**
 * Inferred TypeScript type representing valid TOTP verification form values.
 * Used for typed form state and submission handling in TOTP challenge components.
 *
 * @author Maruf Bepary
 */
export type TotpFormData = z.infer<typeof totpSchema>;
