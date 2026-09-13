import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TotpForm } from "@/app/auth/2fa/_components/forms/totp-form";
import { BackupCodeTab } from "@/app/auth/2fa/_components/tabs/backup-code-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/config/routes";
import { auth } from "@/lib/auth/auth";

/**
 * Tab identifier constants for switching between 2FA challenge methods.
 */
const TAB_VALUES = {
  TOTP: "totp",
  BACKUP: "backup",
} as const;

/**
 * Server-rendered two-factor authentication challenge page.
 * Executes as a React Server Component (RSC) to verify session state before rendering
 * interactive client challenge forms for TOTP authenticators and emergency backup codes.
 *
 * Security Context & Authentication Flow:
 * - Session Inspection: Evaluates incoming request headers using `auth.api.getSession`.
 *   If a fully established authenticated session already exists, the visitor is redirected to `ROUTES.HOME`.
 * - 2FA Challenge State: When a user with 2FA enabled provides valid primary credentials (password/social),
 *   Better Auth issues a temporary challenge cookie rather than a full session token.
 * - Challenge Resolution: Renders tabbed access to `TotpForm` (for 6-digit TOTP app codes)
 *   and `BackupCodeTab` (for single-use emergency recovery codes) to upgrade the challenge into a full session.
 *
 * @returns Server-rendered 2FA challenge container with TOTP and backup code tabs
 * @author Maruf Bepary
 */
export default async function TwoFactorPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  // Redirect signed-in users away from the 2FA challenge screen.
  if (session != null) return redirect(ROUTES.HOME);

  return (
    <div className="my-6 px-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-bold text-2xl">
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={TAB_VALUES.TOTP}>
            <TabsList className="mb-8 grid w-full grid-cols-2">
              <TabsTrigger value={TAB_VALUES.TOTP}>Authenticator</TabsTrigger>
              <TabsTrigger value={TAB_VALUES.BACKUP}>Backup Code</TabsTrigger>
            </TabsList>

            <TabsContent value={TAB_VALUES.TOTP}>
              <TotpForm />
            </TabsContent>

            <TabsContent value={TAB_VALUES.BACKUP}>
              <BackupCodeTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
