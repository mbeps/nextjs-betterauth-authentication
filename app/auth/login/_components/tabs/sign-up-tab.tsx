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
import { NumberInput } from "@/components/ui/number-input";
import { PasswordInput } from "@/components/ui/password-input";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import { type SignUpForm, signUpSchema } from "@/schemas/auth/sign-up.schema";

/**
 * User registration form tab component collecting profile and credential details.
 * Executes as a Client Component ("use client") utilizing React Hook Form, Zod schema validation,
 * and the Better Auth sign-up client API.
 *
 * User Flows & Custom Schema:
 * - Collects standard credentials (full name, email, password) alongside an extended custom
 *   schema field (`favoriteNumber`) mapped into the user entity.
 * - Dispatches registration via `authClient.signUp.email` with `ROUTES.HOME` as the post-verification target.
 * - If the newly registered account requires email verification (`!res.data.user.emailVerified`),
 *   automatically transitions the authentication portal view using `openEmailVerificationTab`.
 *
 * @param props - Component properties containing the callback to navigate to email verification
 * @returns Client-rendered registration form with input fields, loading indicator, and validation messages
 * @author Maruf Bepary
 */
export function SignUpTab({
  openEmailVerificationTab,
}: {
  openEmailVerificationTab: (email: string) => void;
}) {
  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  /**
   * Dispatches new user registration payload to Better Auth and routes to verification if required.
   *
   * @param data - Validated sign-up form fields including name, credentials, and custom profile attributes
   * @author Maruf Bepary
   */
  async function handleSignUp(data: SignUpForm) {
    const res = await authClient.signUp.email(
      { ...data, callbackURL: ROUTES.HOME },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to sign up");
        },
      },
    );

    if (res.error == null && !res.data.user.emailVerified) {
      openEmailVerificationTab(data.email);
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSignUp)}>
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
          <LoadingSwap isLoading={isSubmitting}>Sign Up</LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
