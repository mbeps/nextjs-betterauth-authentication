import type { organization } from "better-auth/plugins/organization";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InviteInformation } from "@/app/organizations/invites/[id]/_components/invite-information";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { auth } from "@/lib/auth/auth";
import { getLogger } from "@/lib/logger";

const log = getLogger(["app", "organizations", "invites"]);

/**
 * Route parameter contract for dynamic organization invitation URLs.
 */
interface InvitationPageProps {
  /**
   * Promise resolving to route parameters including the unique invitation identifier.
   */
  params: Promise<{ id: string }>;
}

/**
 * Server-rendered invitation landing page for joining an organization.
 * Enforces session authentication by redirecting unauthenticated visitors to login.
 * Fetches invitation metadata securely on the server via Better Auth's `getInvitation` endpoint.
 * If the invitation ID is invalid, expired, or not found, redirects the user to the home page;
 * otherwise displays invitation details and interactive acceptance/rejection actions.
 *
 * @param props - Next.js page properties containing dynamic route parameters
 * @returns Server-rendered card displaying organization invite details and actions
 * @author Maruf Bepary
 */
export default async function InvitationPage({ params }: InvitationPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const organizationApi = auth.api as typeof auth.api &
    ReturnType<typeof organization>["endpoints"];
  // Force login before revealing invitation details.
  if (session == null) {
    log.warn("Unauthorized access attempt to organization invite");
    return redirect(ROUTES.AUTH.LOGIN);
  }

  const { id } = await params;
  log.debug("Fetching invitation details (inviteId: {inviteId})", {
    inviteId: id,
  });

  const invitation = await organizationApi
    .getInvitation({
      headers: await headers(),
      query: { id },
    })
    .catch(() => {
      log.warn(
        "Invalid or expired invitation accessed (inviteId: {inviteId})",
        {
          inviteId: id,
        },
      );
      return redirect(ROUTES.HOME);
    });

  return (
    <div className="container mx-auto my-6 max-w-2xl px-4">
      <Card>
        <CardHeader>
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>
            You have been invited to join the {invitation.organizationName}{" "}
            organization as a {invitation.role}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteInformation invitation={invitation} />
        </CardContent>
      </Card>
    </div>
  );
}
