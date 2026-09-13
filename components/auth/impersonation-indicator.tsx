"use client";

import { UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Renders a floating button that lets admins stop impersonation sessions.
 * @returns UI fragment that is only visible while impersonating another user.
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
