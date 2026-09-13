"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Interactive application landing page showcasing navigation options based on authentication state.
 * Runs as a Client Component ("use client") leveraging Better Auth client-side session management hooks
 * and administrative role checks.
 *
 * User Flows & Security Context:
 * - Unauthenticated visitors see a welcome banner with a call-to-action to navigate to the authentication portal (`/auth/login`).
 * - Authenticated users see a personalized greeting displaying their display name (`session.user.name`) alongside quick links
 *   to user profile management (`/profile`) and organization workspaces (`/organizations`).
 * - For authenticated users, an asynchronous permission probe checks for `user:list` capabilities via `authClient.admin.hasPermission`.
 *   When granted, a dedicated navigation link to the administrative console (`/admin`) is conditionally revealed.
 * - Provides a one-click session termination button leveraging `BetterAuthActionButton` to trigger `authClient.signOut()`.
 *
 * @returns Client-rendered home landing page component with conditional authentication views
 * @author Maruf Bepary
 */
export default function Home() {
  const [hasAdminPermission, setHasAdminPermission] = useState(false);
  const { data: session, isPending: loading } = authClient.useSession();

  // Seed admin state as soon as session loads.
  useEffect(() => {
    authClient.admin
      .hasPermission({ permissions: { user: ["list"] } })
      .then(({ data }) => {
        setHasAdminPermission(data?.success ?? false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto my-6 max-w-md px-4">
      <div className="space-y-6 text-center">
        {session == null ? (
          <>
            <h1 className="font-bold text-3xl">Welcome to Our App</h1>
            <Button asChild size="lg">
              <Link href={ROUTES.AUTH.LOGIN}>Sign In / Sign Up</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-bold text-3xl">Welcome {session.user.name}!</h1>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href={ROUTES.PROFILE}>Profile</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={ROUTES.ORGANIZATIONS.DASHBOARD}>Organizations</Link>
              </Button>
              {hasAdminPermission && (
                <Button variant="outline" asChild size="lg">
                  <Link href={ROUTES.ADMIN}>Admin</Link>
                </Button>
              )}
              <BetterAuthActionButton
                size="lg"
                variant="destructive"
                action={() => authClient.signOut()}
              >
                Sign Out
              </BetterAuthActionButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
