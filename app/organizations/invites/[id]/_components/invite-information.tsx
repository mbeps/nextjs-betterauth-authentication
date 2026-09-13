"use client";

import { useRouter } from "next/navigation";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Interactive actions component allowing users to accept or decline an organization invitation.
 * Provides dual action buttons wired to Better Auth mutation methods. Upon acceptance,
 * the member is joined to the organization, the organization is immediately set as active,
 * and the user is redirected to the organizations dashboard. Upon rejection, the invite token is
 * invalidated and the user is redirected to the home page.
 *
 * @param props - Component props containing the invitation ID and organization ID
 * @returns Button controls for accepting or rejecting the invite
 * @author Maruf Bepary
 */
export function InviteInformation({
  invitation,
}: {
  invitation: { id: string; organizationId: string };
}) {
  const router = useRouter();

  /**
   * Accepts the organization invitation and sets the newly joined organization as active.
   * Invokes Better Auth's `organization.acceptInvitation` mutation. On success, persists
   * active workspace selection and navigates to the organizations dashboard.
   *
   * @returns Promise for the acceptance mutation
   * @author Maruf Bepary
   */
  function acceptInvite() {
    return authClient.organization.acceptInvitation(
      { invitationId: invitation.id },
      {
        onSuccess: async () => {
          await authClient.organization.setActive({
            organizationId: invitation.organizationId,
          });
          router.push(ROUTES.ORGANIZATIONS.DASHBOARD);
        },
      },
    );
  }
  /**
   * Rejects the pending organization invitation and redirects to the home page.
   * Invokes Better Auth's `organization.rejectInvitation` mutation, invalidating the invite.
   *
   * @returns Promise for the rejection mutation
   * @author Maruf Bepary
   */
  function rejectInvite() {
    return authClient.organization.rejectInvitation(
      {
        invitationId: invitation.id,
      },
      { onSuccess: () => router.push(ROUTES.HOME) },
    );
  }

  return (
    <div className="flex gap-4">
      <BetterAuthActionButton className="flex-grow" action={acceptInvite}>
        Accept
      </BetterAuthActionButton>
      <BetterAuthActionButton
        className="flex-grow"
        variant="destructive"
        action={rejectInvite}
      >
        Reject
      </BetterAuthActionButton>
    </div>
  );
}
