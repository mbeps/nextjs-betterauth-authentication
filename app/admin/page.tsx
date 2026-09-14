import type { admin, UserWithRole } from "better-auth/plugins/admin";
import { ArrowLeft, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRow } from "@/app/admin/_components/user-row";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/config/routes";
import { auth } from "@/lib/auth/auth";
import { getLogger } from "@/lib/logger";

const log = getLogger(["app", "admin"]);

/**
 * Server-rendered administration console page for managing registered users, roles, and privileges.
 * Executes as a React Server Component (RSC) enforcing strict two-tiered server-side access control.
 *
 * Security Context & Permission Checks:
 * 1. Authentication Gate: Inspects incoming request headers using `auth.api.getSession`. If the visitor
 *    is unauthenticated, they are immediately redirected to the login portal (`/auth/login`).
 * 2. Authorization Gate: Evaluates RBAC permissions via the Better Auth Admin plugin endpoint
 *    `adminApi.userHasPermission` verifying whether the actor possesses `user:list` permissions.
 *    Unauthorized or non-admin actors are redirected to the application homepage (`/`).
 *
 * User Flows & Data Fetching:
 * - Fetches up to 100 registered accounts ordered chronologically descending using `adminApi.listUsers`.
 * - Renders a tabular management interface containing user avatars, names, emails, assigned roles, and creation dates.
 * - Delegates row-level interactive mutations (role modification, account bans/unbans, impersonation, deletion)
 *   to the client-side `UserRow` component, forwarding `session.user.id` as `selfId` to prevent self-destructive operations.
 *
 * @returns Server-rendered administrative user management dashboard
 * @author Maruf Bepary
 */
export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const adminApi = auth.api as typeof auth.api &
    ReturnType<typeof admin>["endpoints"];

  // Ensure only admins with list permission can view the dashboard.
  if (session == null) {
    log.warn("Unauthorized access attempt to admin dashboard");
    return redirect(ROUTES.AUTH.LOGIN);
  }
  const hasAccess = await adminApi.userHasPermission({
    headers: await headers(),
    body: { permissions: { user: ["list"] } },
  });
  if (!hasAccess.success) {
    log.warn("Forbidden access attempt to admin dashboard (userId: {userId})", {
      userId: session.user.id,
    });
    return redirect(ROUTES.HOME);
  }

  log.debug("Fetching user list for admin dashboard");
  const users = await adminApi.listUsers({
    headers: await headers(),
    query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
  });

  return (
    <div className="container mx-auto my-6 px-4">
      <Link href={ROUTES.HOME} className="mb-6 inline-flex items-center">
        <ArrowLeft className="mr-2 size-4" />
        Back to Home
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({users.total})
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.users.map((user: UserWithRole) => (
                  <UserRow key={user.id} user={user} selfId={session.user.id} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
