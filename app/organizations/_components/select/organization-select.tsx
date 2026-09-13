"use client";

import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Interactive dropdown selector that switches the active organization context for the session.
 * Retrieves all organizations the authenticated user belongs to via `useListOrganizations` and
 * syncs the selected value with `useActiveOrganization`. When changed, it updates the active
 * organization session state so all subsequent organization-scoped requests target the chosen workspace.
 *
 * @returns Select dropdown component, or null if the user has no organization memberships
 * @author Maruf Bepary
 */
export function OrganizationSelect() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: organizations } = authClient.useListOrganizations();

  if (organizations == null || organizations.length === 0) {
    return null;
  }

  /**
   * Updates the active organization in session state via Better Auth.
   * Dispatches `organization.setActive` to update session cookies and reactive context,
   * triggering UI updates across tabs and displaying a toast notification if the switch fails.
   *
   * @param organizationId - Identifier of the organization to set as active
   * @author Maruf Bepary
   */
  function setActiveOrganization(organizationId: string) {
    authClient.organization.setActive(
      { organizationId },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to switch organization");
        },
      },
    );
  }

  return (
    <Select
      value={activeOrganization?.id ?? ""}
      onValueChange={setActiveOrganization}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an organization" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
