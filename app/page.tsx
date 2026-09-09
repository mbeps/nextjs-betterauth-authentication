"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BetterAuthActionButton } from "@/components/auth/buttons/better-auth-action-button";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { ROUTES } from "@/lib/routes";

/**
 * Landing page that surfaces navigation options based on session state.
 * @returns Client-rendered home page component.
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
