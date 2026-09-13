"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SocialAuthButtons } from "@/app/auth/login/_components/buttons/social-auth-buttons";
import { EmailVerification } from "@/app/auth/login/_components/forms/email-verification";
import { ForgotPassword } from "@/app/auth/login/_components/forms/forgot-password";
import { SignInTab } from "@/app/auth/login/_components/tabs/sign-in-tab";
import { SignUpTab } from "@/app/auth/login/_components/tabs/sign-up-tab";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Tab identifier constants representing the available authentication views.
 */
const TAB_VALUES = {
  SIGN_IN: "signin",
  SIGN_UP: "signup",
  EMAIL_VERIFICATION: "email-verification",
  FORGOT_PASSWORD: "forgot-password",
} as const;

/**
 * Union type representing active tab values within the authentication portal.
 */
type Tab = (typeof TAB_VALUES)[keyof typeof TAB_VALUES];

/**
 * Centralized client-side authentication portal coordinating user access flows.
 * Executes as a Client Component ("use client") managing tabbed navigation across sign-in,
 * registration, email verification, and password recovery workflows.
 *
 * User Flows & Security Context:
 * - Session Guard: On component mount, probes the current session via `authClient.getSession()`.
 *   If an authenticated session is already active, the user is proactively redirected to `ROUTES.HOME`.
 * - Credentials & Passkeys: Hosts the `SignInTab` for email/password and WebAuthn passkey authentication,
 *   as well as `SignUpTab` for new user registration.
 * - Social Authentication: Mounts `SocialAuthButtons` across credentials tabs for OAuth federated sign-in.
 * - Verification & Recovery: Intercepts unverified email states or forgotten passwords, transitioning
 *   the interface dynamically into `EmailVerification` or `ForgotPassword` views.
 *
 * @returns Client-rendered authentication portal with responsive tabbed cards
 * @author Maruf Bepary
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [selectedTab, setSelectedTab] = useState<Tab>(TAB_VALUES.SIGN_IN);

  // Redirect authenticated users away from the auth flow.
  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data != null) router.push(ROUTES.HOME);
    });
  }, [router]);

  /**
   * Transitions the active portal view to the email verification screen for a specific address.
   *
   * @param email - Target email address requiring verification
   * @author Maruf Bepary
   */
  function openEmailVerificationTab(email: string) {
    setEmail(email);
    setSelectedTab(TAB_VALUES.EMAIL_VERIFICATION);
  }

  return (
    <Tabs
      value={selectedTab}
      onValueChange={(t) => setSelectedTab(t as Tab)}
      className="max-auto my-6 w-full px-4"
    >
      {(selectedTab === TAB_VALUES.SIGN_IN ||
        selectedTab === TAB_VALUES.SIGN_UP) && (
        <TabsList>
          <TabsTrigger value={TAB_VALUES.SIGN_IN}>Sign In</TabsTrigger>
          <TabsTrigger value={TAB_VALUES.SIGN_UP}>Sign Up</TabsTrigger>
        </TabsList>
      )}
      <TabsContent value={TAB_VALUES.SIGN_IN}>
        <Card>
          <CardHeader className="font-bold text-2xl">
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <SignInTab
              openEmailVerificationTab={openEmailVerificationTab}
              openForgotPassword={() =>
                setSelectedTab(TAB_VALUES.FORGOT_PASSWORD)
              }
            />
          </CardContent>

          <Separator />

          <CardFooter className="grid grid-cols-2 gap-3">
            <SocialAuthButtons />
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value={TAB_VALUES.SIGN_UP}>
        <Card>
          <CardHeader className="font-bold text-2xl">
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <SignUpTab openEmailVerificationTab={openEmailVerificationTab} />
          </CardContent>

          <Separator />

          <CardFooter className="grid grid-cols-2 gap-3">
            <SocialAuthButtons />
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value={TAB_VALUES.EMAIL_VERIFICATION}>
        <Card>
          <CardHeader className="font-bold text-2xl">
            <CardTitle>Verify Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailVerification email={email} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value={TAB_VALUES.FORGOT_PASSWORD}>
        <Card>
          <CardHeader className="font-bold text-2xl">
            <CardTitle>Forgot Password</CardTitle>
          </CardHeader>
          <CardContent>
            <ForgotPassword
              openSignInTab={() => setSelectedTab(TAB_VALUES.SIGN_IN)}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
