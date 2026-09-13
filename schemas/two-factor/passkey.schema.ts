import z from "zod";

/**
 * Validation schema for registering a new WebAuthn passkey credential.
 * Used when adding a passkey authenticator via the Better Auth Passkey plugin.
 * Enforces a non-empty descriptive name to identify the authenticator device (e.g., "MacBook Touch ID", "YubiKey").
 *
 * @author Maruf Bepary
 */
export const passkeySchema = z.object({
  name: z.string().min(1),
});

/**
 * Inferred TypeScript type representing valid passkey registration form values.
 * Used for typed form state and submission handling in passkey management components.
 *
 * @author Maruf Bepary
 */
export type PasskeyForm = z.infer<typeof passkeySchema>;
