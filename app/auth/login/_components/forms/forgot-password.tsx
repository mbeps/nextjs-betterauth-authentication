"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import {
  type ForgotPasswordForm,
  forgotPasswordSchema,
} from "@/schemas/auth/forgot-password.schema";

/**
 * Client form component enabling self-service password reset requests.
 * Executes as a Client Component ("use client") utilizing React Hook Form, Zod validation,
 * and the Better Auth password reset client API.
 *
 * Security Context & Flow:
 * - Accepts an account email address, validating syntax against `forgotPasswordSchema`.
 * - Triggers `authClient.requestPasswordReset` specifying `ROUTES.AUTH.RESET_PASSWORD` (`/auth/reset-password`)
 *   as the destination URL embedded in the generated security token email link.
 * - Displays success or failure alerts via toast notifications without leaking whether an email address exists.
 * - Provides a return navigation control (`openSignInTab`) to switch back to the credentials sign-in view.
 *
 * @param props - Component properties containing the callback to return to the sign-in tab
 * @returns Client-rendered password recovery form with input field, back control, and submit action
 * @author Maruf Bepary
 */
export function ForgotPassword({
  openSignInTab,
}: {
  openSignInTab: () => void;
}) {
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { isSubmitting } = form.formState;

  /**
   * Submits the user's email address to request a secure password reset link.
   *
   * @param data - Validated form payload containing the user's email address
   * @author Maruf Bepary
   */
  async function handleForgotPassword(data: ForgotPasswordForm) {
    await authClient.requestPasswordReset(
      {
        ...data,
        redirectTo: ROUTES.AUTH.RESET_PASSWORD,
      },
      {
        onError: (error) => {
          toast.error(
            error.error.message || "Failed to send password reset email",
          );
        },
        onSuccess: () => {
          toast.success("Password reset email sent");
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(handleForgotPassword)}
      >
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

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={openSignInTab}>
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            <LoadingSwap isLoading={isSubmitting}>Send Reset Email</LoadingSwap>
          </Button>
        </div>
      </form>
    </Form>
  );
}
