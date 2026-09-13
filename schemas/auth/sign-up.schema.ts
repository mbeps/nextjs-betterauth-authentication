import z from "zod";

/**
 * Validation schema for new user registration requests.
 * Used during user sign-up via Better Auth signUp.email flow.
 * Enforces non-empty user name, valid email format, minimum 6-character password,
 * and an integer value for the application's custom favoriteNumber profile attribute.
 *
 * @author Maruf Bepary
 */
export const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.email().min(1),
  password: z.string().min(6),
  favoriteNumber: z.number().int(),
});

/**
 * Inferred TypeScript type representing valid sign-up form values.
 * Used for typed form state and submission handling in registration components.
 *
 * @author Maruf Bepary
 */
export type SignUpForm = z.infer<typeof signUpSchema>;
