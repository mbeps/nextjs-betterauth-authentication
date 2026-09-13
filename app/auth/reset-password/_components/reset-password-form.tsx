"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { PasswordInput } from "@/components/ui/password-input";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import {
  type ResetPasswordForm,
  resetPasswordSchema,
} from "@/schemas/auth/reset-password.schema";

/**
 * Client form component handling secure password reset submission using a tokenized URL.
 * Executes as a Client Component ("use client") parsing search parameters and submitting
 * password updates via Better Auth.
 *
 * Security Context & Token Handling:
 * - Extracts `token` and `error` parameters from the active URL query string using `useSearchParams`.
 * - If the token is missing or if the query string indicates an error (e.g. invalid or expired token),
 *   aborts form rendering and displays an "Invalid Reset Link" error card linking back to `/auth/login`.
 * - Enforces client-side password strength validation rules defined in `resetPasswordSchema`.
 * - Calls `authClient.resetPassword` passing the verified token and new plaintext password over TLS.
 * - On successful update, displays a confirmation toast and smoothly redirects to `ROUTES.AUTH.LOGIN`.
 *
 * @returns Client-rendered password reset form or invalid link notification card
 * @author Maruf Bepary
 */
export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  /**
   * Submits the updated password alongside the reset token to the Better Auth backend.
   *
   * @param data - Validated form payload containing the newly chosen password
   * @author Maruf Bepary
   */
  async function handleResetPassword(data: ResetPasswordForm) {
    if (token == null) return;

    await authClient.resetPassword(
      {
        newPassword: data.password,
        token,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to reset password");
        },
        onSuccess: () => {
          toast.success("Password reset successful", {
            description: "Redirection to login...",
          });
          setTimeout(() => {
            router.push(ROUTES.AUTH.LOGIN);
          }, 1000);
        },
      },
    );
  }

  if (token == null || error != null) {
    return (
      <div className="my-6 px-4">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>
              The password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href={ROUTES.AUTH.LOGIN}>Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="my-6 px-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handleResetPassword)}
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="flex-1">
                <LoadingSwap isLoading={isSubmitting}>
                  Reset Password
                </LoadingSwap>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
