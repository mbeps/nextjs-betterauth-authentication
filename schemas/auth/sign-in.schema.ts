import z from "zod";

/**
 * Validation schema for user credential sign-in requests.
 * Used during password-based authentication via Better Auth signIn.email flow.
 * Enforces valid email format and a minimum password length of 6 characters.
 *
 * @author Maruf Bepary
 */
export const signInSchema = z.object({
  email: z.email().min(1),
  password: z.string().min(6),
});

/**
 * Inferred TypeScript type representing valid sign-in form values.
 * Used for typed form state and submission handling in sign-in components.
 *
 * @author Maruf Bepary
 */
export type SignInForm = z.infer<typeof signInSchema>;
