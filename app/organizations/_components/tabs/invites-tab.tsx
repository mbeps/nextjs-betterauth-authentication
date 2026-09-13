"use client";

import { CreateInviteButton } from "@/app/organizations/_components/buttons/create-invite-button";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth/auth-client";
import { INVITATION_STATUS } from "@/lib/auth/roles";

/**
 * Tab panel managing pending invitations for the active organization.
 * Filters active organization invitations to show only outstanding invitations (`INVITATION_STATUS.PENDING`),
 * displays recipient emails, proposed roles, and expiration dates, and provides actions to revoke invitations
 * or spawn the dialog to invite new members.
 *
 * @returns Invitations management view with pending invite list and creation trigger
 * @author Maruf Bepary
 */
export function InvitesTab() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const pendingInvites = activeOrganization?.invitations?.filter(
    (invite) => invite.status === INVITATION_STATUS.PENDING,
  );

  /**
   * Revokes an outstanding organization invitation before it is accepted or expired.
   * Calls Better Auth's `organization.cancelInvitation` endpoint, invalidating the invitation token
   * and reactively removing the invite from the active organization's pending list.
   *
   * @param invitationId - Unique identifier of the invitation to cancel
   * @returns Promise resolving when the invitation has been cancelled
   * @author Maruf Bepary
   */
  function cancelInvitation(invitationId: string) {
    return authClient.organization.cancelInvitation({ invitationId });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateInviteButton />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingInvites?.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell>{invitation.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{invitation.role}</Badge>
              </TableCell>
              <TableCell>
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <BetterAuthActionButton
                  variant="destructive"
                  size="sm"
                  action={() => cancelInvitation(invitation.id)}
                >
                  Cancel
                </BetterAuthActionButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
