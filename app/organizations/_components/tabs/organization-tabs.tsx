"use client";

import { InvitesTab } from "@/app/organizations/_components/tabs/invites-tab";
import { MembersTab } from "@/app/organizations/_components/tabs/members-tab";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Tab identifiers for the organization management interface.
 */
const TAB_VALUES = {
  MEMBERS: "members",
  INVITATIONS: "invitations",
} as const;

/**
 * Client-side tabbed layout switching between organization members and pending invitations.
 * Reactively subscribes to the currently selected organization using Better Auth's
 * `useActiveOrganization` hook. Only renders management tabs when an organization is active,
 * ensuring controls for member roles and invitation workflows are scoped to a valid workspace context.
 *
 * @returns Organization tab panel or empty container when no organization is active
 * @author Maruf Bepary
 */
export function OrganizationTabs() {
  const { data: activeOrganization } = authClient.useActiveOrganization();

  return (
    <div className="space-y-4">
      {activeOrganization && (
        <Tabs defaultValue={TAB_VALUES.MEMBERS} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={TAB_VALUES.MEMBERS}>Members</TabsTrigger>
            <TabsTrigger value={TAB_VALUES.INVITATIONS}>
              Invitations
            </TabsTrigger>
          </TabsList>
          <Card>
            <CardContent>
              <TabsContent value={TAB_VALUES.MEMBERS}>
                <MembersTab />
              </TabsContent>

              <TabsContent value={TAB_VALUES.INVITATIONS}>
                <InvitesTab />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      )}
    </div>
  );
}
