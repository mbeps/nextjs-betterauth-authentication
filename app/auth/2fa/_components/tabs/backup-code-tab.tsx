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
  type BackupCodeForm,
  backupCodeSchema,
} from "@/schemas/two-factor/backup-code.schema";

/**
 * Client form component for completing a two-factor challenge using a single-use emergency backup code.
 * Executes as a Client Component ("use client") utilizing React Hook Form, Zod schema validation,
 * and the Better Auth two-factor backup code client API.
 *
 * Security Context & Flow:
 * - Serves as a fallback recovery path for users locked out of their primary authenticator device.
 * - Validates input against `backupCodeSchema` to ensure proper code formatting before submission.
 * - Invokes `authClient.twoFactor.verifyBackupCode` against the Better Auth verification endpoint.
 * - On successful validation, the backend invalidates the consumed backup code, grants full session
 *   authorization, and the client navigates to `ROUTES.HOME`.
 *
 * @returns Client-rendered emergency backup code verification form with input field and submit button
 * @author Maruf Bepary
 */
export function BackupCodeTab() {
  const router = useRouter();
  const form = useForm<BackupCodeForm>({
    resolver: zodResolver(backupCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const { isSubmitting } = form.formState;

  /**
   * Submits a single-use emergency backup recovery code to Better Auth and navigates upon success.
   *
   * @param data - Validated form payload containing the backup code
   * @author Maruf Bepary
   */
  async function handleBackupCodeVerification(data: BackupCodeForm) {
    await authClient.twoFactor.verifyBackupCode(data, {
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
        onSubmit={form.handleSubmit(handleBackupCodeVerification)}
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Backup Code</FormLabel>
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
