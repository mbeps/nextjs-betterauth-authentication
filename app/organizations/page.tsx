import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateOrganizationButton } from "@/app/organizations/_components/buttons/create-organization-button";
import { OrganizationSelect } from "@/app/organizations/_components/select/organization-select";
import { OrganizationTabs } from "@/app/organizations/_components/tabs/organization-tabs";
import { ROUTES } from "@/config/routes";
import { auth } from "@/lib/auth/auth";

/**
 * Server-rendered dashboard page for managing organizations and team memberships.
 * Requires an authenticated user session, redirecting unauthenticated visitors to the login route.
 * Provides entry points for switching active organizations, creating new workspaces, and inspecting
 * team members and pending invitations through reactive client components.
 *
 * @returns Server-rendered organizations management dashboard
 * @author Maruf Bepary
 */
export default async function OrganizationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  // Require authentication before accessing organization resources.
  if (session == null) return redirect(ROUTES.AUTH.LOGIN);

  return (
    <div className="container mx-auto my-6 px-4">
      <Link href={ROUTES.HOME} className="mb-6 inline-flex items-center">
        <ArrowLeft className="mr-2 size-4" />
        Back to Home
      </Link>

      <div className="mb-8 flex items-center gap-2">
        <OrganizationSelect />
        <CreateOrganizationButton />
      </div>

      <OrganizationTabs />
    </div>
  );
}
