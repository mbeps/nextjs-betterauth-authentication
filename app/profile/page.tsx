import { ArrowLeft, Key, LinkIcon, Shield, Trash2, User } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth/auth";
import { ROUTES } from "@/lib/routes";
import { AccountDeletion } from "./_components/account/account-deletion";
import { LinkedAccountsTab } from "./_components/account/linked-accounts-tab";
import { ProfileUpdateForm } from "./_components/profile/profile-update-form";
import { SecurityTab } from "./_components/security/security-tab";
import { SessionsTab } from "./_components/session/sessions-tab";
import { LoadingSuspense } from "./_components/shared/loading-suspense";

const TAB_VALUES = {
  PROFILE: "profile",
  SECURITY: "security",
  SESSIONS: "sessions",
  ACCOUNTS: "accounts",
  DANGER: "danger",
} as const;

/**
 * Profile dashboard that surfaces personal data, security tools, and danger zone actions.
 * @returns Server-rendered profile page requiring an authenticated session.
 */
export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  // Redirect guests to the authentication flow.
  if (session == null) return redirect(ROUTES.AUTH.LOGIN);
  const user = session.user as typeof session.user & {
    favoriteNumber: number;
    role?: string;
    twoFactorEnabled?: boolean;
  };

  return (
    <div className="mx-auto my-6 max-w-4xl px-4">
      <div className="mb-8">
        <Link href={ROUTES.HOME} className="mb-6 inline-flex items-center">
          <ArrowLeft className="mr-2 size-4" />
          Back to Home
        </Link>
        <div className="flex items-center space-x-4">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-muted">
            {user.image ? (
              <Image
                width={64}
                height={64}
                src={user.image}
                alt="User Avatar"
                className="object-cover"
              />
            ) : (
              <User className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-1">
              <h1 className="font-bold text-3xl">
                {user.name || "User Profile"}
              </h1>
              <Badge>{user.role}</Badge>
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <Tabs className="space-y-2" defaultValue={TAB_VALUES.PROFILE}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value={TAB_VALUES.PROFILE}>
            <User />
            <span className="max-sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value={TAB_VALUES.SECURITY}>
            <Shield />
            <span className="max-sm:hidden">Security</span>
          </TabsTrigger>
          <TabsTrigger value={TAB_VALUES.SESSIONS}>
            <Key />
            <span className="max-sm:hidden">Sessions</span>
          </TabsTrigger>
          <TabsTrigger value={TAB_VALUES.ACCOUNTS}>
            <LinkIcon />
            <span className="max-sm:hidden">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value={TAB_VALUES.DANGER}>
            <Trash2 />
            <span className="max-sm:hidden">Danger</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_VALUES.PROFILE}>
          <Card>
            <CardContent>
              <ProfileUpdateForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={TAB_VALUES.SECURITY}>
          <LoadingSuspense>
            <SecurityTab
              email={user.email}
              isTwoFactorEnabled={user.twoFactorEnabled ?? false}
            />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value={TAB_VALUES.SESSIONS}>
          <LoadingSuspense>
            <SessionsTab currentSessionToken={session.session.token} />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value={TAB_VALUES.ACCOUNTS}>
          <LoadingSuspense>
            <LinkedAccountsTab />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value={TAB_VALUES.DANGER}>
          <Card className="border border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountDeletion />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
