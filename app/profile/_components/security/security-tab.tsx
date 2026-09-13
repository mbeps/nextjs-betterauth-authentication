import type { passkey } from "@better-auth/passkey";
import { headers } from "next/headers";
import { ChangePasswordForm } from "@/app/profile/_components/security/change-password-form";
import { PasskeyManagement } from "@/app/profile/_components/security/passkey-management";
import { SetPasswordButton } from "@/app/profile/_components/security/set-password-button";
import { TwoFactorAuth } from "@/app/profile/_components/security/two-factor-auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth/auth";

/**
 * Inferred account representation for user authentication providers.
 */
type Account = Awaited<ReturnType<typeof auth.api.listUserAccounts>>[number];

/**
 * Server-rendered security center coordinating password lifecycle, two-factor authentication, and WebAuthn passkeys.
 * Concurrently queries registered passkeys and linked accounts on the server to determine credential capabilities.
 * Dynamically branches authentication controls: accounts with existing password credentials receive change-password
 * and TOTP two-factor authentication controls, whereas OAuth-only accounts are presented with a set-password flow.
 * Also renders biometric and hardware security key management via WebAuthn passkeys.
 *
 * @param props - Component properties containing user email and two-factor status
 * @returns Stacked security cards for credential, 2FA, and passkey management
 * @author Maruf Bepary
 */
export async function SecurityTab({
  email,
  isTwoFactorEnabled,
}: {
  email: string;
  isTwoFactorEnabled: boolean;
}) {
  const passkeyApi = auth.api as typeof auth.api &
    ReturnType<typeof passkey>["endpoints"];
  const [passkeys, accounts] = await Promise.all([
    passkeyApi.listPasskeys({ headers: await headers() }),
    auth.api.listUserAccounts({ headers: await headers() }),
  ]);

  const hasPasswordAccount = accounts.some(
    (account: Account) => account.providerId === "credential",
  );

  return (
    <div className="space-y-6">
      {hasPasswordAccount ? (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password for improved security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Set Password</CardTitle>
            <CardDescription>
              We will send you a password reset email to set up a password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SetPasswordButton email={email} />
          </CardContent>
        </Card>
      )}
      {hasPasswordAccount && (
        <Card>
          <CardHeader className="flex items-center justify-between gap-2">
            <CardTitle>Two-Factor Authentication</CardTitle>
            <Badge variant={isTwoFactorEnabled ? "default" : "secondary"}>
              {isTwoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardHeader>
          <CardContent>
            <TwoFactorAuth isEnabled={isTwoFactorEnabled} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
        </CardHeader>
        <CardContent>
          <PasskeyManagement passkeys={passkeys} />
        </CardContent>
      </Card>
    </div>
  );
}
