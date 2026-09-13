import z from "zod";

/**
 * Validation schema for updating user profile details and settings.
 * Used when a user modifies their account profile through Better Auth updateUser and changeEmail flows.
 * Enforces non-empty display name, valid email format (triggering re-verification if altered),
 * and an integer value for the custom favoriteNumber profile attribute.
 *
 * @author Maruf Bepary
 */
export const profileUpdateSchema = z.object({
  name: z.string().min(1),
  email: z.email().min(1),
  favoriteNumber: z.number().int(),
});

/**
 * Inferred TypeScript type representing valid profile update form values.
 * Used for typed form state and submission handling in profile settings components.
 *
 * @author Maruf Bepary
 */
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
