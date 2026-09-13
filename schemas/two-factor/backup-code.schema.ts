import z from "zod";

/**
 * Validation schema for two-factor authentication backup code verification.
 * Used as a recovery fallback during 2FA login via the Better Auth Two-Factor plugin
 * when the user is unable to generate standard TOTP codes.
 * Enforces submission of a non-empty backup code string to authenticate and consume the one-time emergency code.
 *
 * @author Maruf Bepary
 */
export const backupCodeSchema = z.object({
  code: z.string().min(1),
});

/**
 * Inferred TypeScript type representing valid backup code verification form values.
 * Used for typed form state and submission handling in 2FA backup code recovery components.
 *
 * @author Maruf Bepary
 */
export type BackupCodeForm = z.infer<typeof backupCodeSchema>;
