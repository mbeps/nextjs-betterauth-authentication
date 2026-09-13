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
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import {
  type TotpFormData,
  totpSchema,
} from "@/schemas/two-factor/totp.schema";

/**
 * Client form component for completing a two-factor challenge using a time-based one-time password (TOTP).
 * Executes as a Client Component ("use client") utilizing React Hook Form, Zod schema validation,
 * and the Better Auth two-factor client extension.
 *
 * Security Context & Flow:
 * - Prompts the user for their 6-digit authenticator code (Google Authenticator, Authy, 1Password).
 * - Enforces schema validation using `totpSchema` before dispatching the verification request.
 * - Invokes `authClient.twoFactor.verifyTotp` against the Better Auth two-factor challenge endpoint.
 * - On successful verification, the server issues a fully authenticated session cookie, and
 *   the client routes the user to `ROUTES.HOME`.
 *
 * @returns Client-rendered TOTP challenge verification form with input field and submit button
 * @author Maruf Bepary
 */
export function TotpForm() {
  const router = useRouter();
  const form = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: {
      code: "",
    },
  });

  const { isSubmitting } = form.formState;

  /**
   * Submits the 6-digit TOTP challenge code to Better Auth and navigates upon success.
   *
   * @param data - Validated form payload containing the 6-digit authenticator code
   * @author Maruf Bepary
   */
  async function handleTotpVerification(data: TotpFormData) {
    await authClient.twoFactor.verifyTotp(data, {
      onError: (error) => {
        toast.error(error.error.message || "Failed to verify code");
      },
      onSuccess: () => {
        router.push(ROUTES.HOME);
      },
    });
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(handleTotpVerification)}
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          <LoadingSwap isLoading={isSubmitting}>Verify</LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
