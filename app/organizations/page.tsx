import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { ROUTES } from "@/lib/routes";
import { CreateOrganizationButton } from "./_components/buttons/create-organization-button";
import { OrganizationSelect } from "./_components/select/organization-select";
import { OrganizationTabs } from "./_components/tabs/organization-tabs";

/**
 * Organizations dashboard where members switch, create, and manage teams.
 * @returns Server-rendered organizations page.
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
