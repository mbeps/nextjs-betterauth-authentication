"use client";

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
import { ORG_ROLES } from "@/lib/auth/roles";

/**
 * Tab panel rendering the active organization's member roster and role badges.
 * Subscribes reactively to the current organization and session via Better Auth client hooks.
 * Displays member profile details, maps roles (owner, admin, member) to distinct visual badges,
 * and provides confirmation-protected deletion actions to revoke organization memberships.
 *
 * @returns Roster table displaying members and role-based removal controls
 * @author Maruf Bepary
 */
export function MembersTab() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();

  /**
   * Revokes membership for a specified user within the active organization.
   * Dispatches Better Auth's `organization.removeMember` API call, which revokes organization-scoped
   * permissions and updates active organization state reactively.
   *
   * @param memberId - Unique membership identifier or email address to remove
   * @returns Promise resolving to the removal response from Better Auth
   * @author Maruf Bepary
   */
  function removeMember(memberId: string) {
    return authClient.organization.removeMember({
      memberIdOrEmail: memberId,
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activeOrganization?.members?.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.user.name}</TableCell>
            <TableCell>{member.user.email}</TableCell>
            <TableCell>
              <Badge
                variant={
                  member.role === ORG_ROLES.OWNER
                    ? "default"
                    : member.role === ORG_ROLES.ADMIN
                      ? "secondary"
                      : "outline"
                }
              >
                {member.role}
              </Badge>
            </TableCell>
            <TableCell>
              {member.userId !== session?.user.id && (
                <BetterAuthActionButton
                  requireAreYouSure
                  variant="destructive"
                  size="sm"
                  action={() => removeMember(member.id)}
                >
                  Remove
                </BetterAuthActionButton>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
