"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PasskeyButton } from "@/app/auth/login/_components/buttons/passkey-button";
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
import { PasswordInput } from "@/components/ui/password-input";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import { type SignInForm, signInSchema } from "@/schemas/auth/sign-in.schema";

/**
 * Interactive email and password sign-in form tab component.
 * Executes as a Client Component ("use client") utilizing React Hook Form, Zod validation,
 * and Better Auth client authentication APIs.
 *
 * Security Context & Authentication Flows:
 * - Credentials Sign-In: Submits email and password pairs via `authClient.signIn.email`.
 * - Email Verification Gate: Detects the `EMAIL_NOT_VERIFIED` error code returned by Better Auth,
 *   automatically redirecting the user to the email verification screen via `openEmailVerificationTab`.
 * - Passkey Integration: Integrates autofill metadata (`webauthn`) in input fields and embeds
 *   the `PasskeyButton` for passwordless WebAuthn / FIDO2 authentication.
 * - Recovery Navigation: Exposes a trigger to switch tabs into the password recovery workflow (`openForgotPassword`).
 *
 * @param props - Component properties containing navigation callbacks for email verification and password reset
 * @returns Client-rendered sign-in form containing input fields, validation feedback, and passkey options
 * @author Maruf Bepary
 */
export function SignInTab({
  openEmailVerificationTab,
  openForgotPassword,
}: {
  openEmailVerificationTab: (email: string) => void;
  openForgotPassword: () => void;
}) {
  const router = useRouter();
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  /**
   * Submits user credentials to Better Auth and navigates upon successful authentication.
   * If an unverified email error code is encountered, transitions to the verification tab.
   *
   * @param data - Validated sign-in form submission values including email and password
   * @author Maruf Bepary
   */
  async function handleSignIn(data: SignInForm) {
    await authClient.signIn.email(
      { ...data, callbackURL: ROUTES.HOME },
      {
        onError: (error) => {
          if (error.error.code === "EMAIL_NOT_VERIFIED") {
            openEmailVerificationTab(data.email);
          }
          toast.error(error.error.message || "Failed to sign in");
        },
        onSuccess: () => {
          router.push(ROUTES.HOME);
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSignIn)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email webauthn"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Button
                    onClick={openForgotPassword}
                    type="button"
                    variant="link"
                    size="sm"
                    className="font-normal text-sm underline"
                  >
                    Forgot password?
                  </Button>
                </div>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password webauthn"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            <LoadingSwap isLoading={isSubmitting}>Sign In</LoadingSwap>
          </Button>
        </form>
      </Form>
      <PasskeyButton />
    </div>
  );
}
