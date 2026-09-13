"use client";

import { UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Fixed overlay indicator and control button displayed during an active admin impersonation session.
 * Inspects the current client session for `impersonatedBy` metadata; when present, displays a prominent
 * floating destructive action button at the bottom-left corner of the viewport. Clicking the button stops
 * impersonation via the Better Auth admin client, refreshes session data, and redirects the administrator back
 * to the admin dashboard (`ROUTES.ADMIN`).
 *
 * @returns Floating UI button if impersonation is active, or null if the session is standard/unimpersonated
 * @author Maruf Bepary
 */
export function ImpersonationIndicator() {
  const router = useRouter();
  const { data: session, refetch } = authClient.useSession();

  // Do not render when there is no impersonation metadata.
  if (session?.session.impersonatedBy == null) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <BetterAuthActionButton
        action={() =>
          authClient.admin.stopImpersonating(undefined, {
            onSuccess: () => {
              router.push(ROUTES.ADMIN);
              refetch();
            },
          })
        }
        variant="destructive"
        size="sm"
      >
        <UserX className="size-4" />
      </BetterAuthActionButton>
    </div>
  );
}
