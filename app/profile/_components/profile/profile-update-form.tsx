"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { NumberInput } from "@/components/ui/number-input";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import {
  type ProfileUpdateFormData,
  profileUpdateSchema,
} from "@/schemas/profile/profile-update.schema";

/**
 * Inferred parameter payload type for Better Auth user profile updates.
 */
type UpdateUserPayload = Parameters<typeof authClient.updateUser>[0];

/**
 * Client form component for modifying user profile attributes and requesting email changes.
 * Manages form state with React Hook Form and Zod schema validation (`profileUpdateSchema`).
 * Dispatches profile metadata updates (such as name and custom database fields like `favoriteNumber`)
 * via Better Auth's `updateUser`. If the email address has changed, triggers a verification email
 * challenge via `changeEmail` requiring the user to verify the new address before the update takes effect.
 *
 * @param props - Component props containing initial user profile values
 * @returns Profile editing form with validation and submission states
 * @author Maruf Bepary
 */
export function ProfileUpdateForm({
  user,
}: {
  user: {
    email: string;
    name: string;
    favoriteNumber: number;
  };
}) {
  const router = useRouter();
  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: user,
  });

  const { isSubmitting } = form.formState;

  /**
   * Submits profile changes to Better Auth, coordinating user metadata updates and email transitions.
   * Compares the submitted email against the current email, conditionally firing `changeEmail` with a
   * verification callback URL alongside `updateUser`. Displays contextual notifications and refreshes the route.
   *
   * @param data - Validated form values containing name, email, and custom attributes
   * @author Maruf Bepary
   */
  async function handleProfileUpdate(data: ProfileUpdateFormData) {
    const updateUserPayload: UpdateUserPayload = {
      name: data.name,
      favoriteNumber: data.favoriteNumber,
    };

    const promises = [authClient.updateUser(updateUserPayload)];

    if (data.email !== user.email) {
      promises.push(
        authClient.changeEmail({
          newEmail: data.email,
          callbackURL: ROUTES.PROFILE,
        }),
      );
    }

    const res = await Promise.all(promises);

    const updateUserResult = res[0];
    const emailResult = res[1] ?? { error: false };

    if (updateUserResult.error) {
      toast.error(updateUserResult.error.message || "Failed to update profile");
    } else if (emailResult.error) {
      toast.error(emailResult.error.message || "Failed to change email");
    } else {
      if (data.email !== user.email) {
        toast.success("Verify your new email address to complete the change.");
      } else {
        toast.success("Profile updated successfully");
      }
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(handleProfileUpdate)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="favoriteNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favorite Number</FormLabel>
              <FormControl>
                <NumberInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          <LoadingSwap isLoading={isSubmitting}>Update Profile</LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
