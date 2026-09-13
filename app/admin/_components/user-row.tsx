"use client";

import type { UserWithRole } from "better-auth/plugins/admin";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import { GLOBAL_ROLES } from "@/lib/auth/roles";

/**
 * Interactive table row component rendering user details and administrative moderation controls.
 * Executes as a Client Component ("use client") integrating with Better Auth admin client APIs
 * and Sonner notification toasts.
 *
 * Security Context & Permissions:
 * - Employs a self-guard check (`isSelf = user.id === selfId`) to prevent the authenticated administrator
 *   from impersonating, banning, revoking sessions for, or deleting their own active account.
 * - Actions trigger client-side mutations against the Better Auth Admin API (`authClient.admin.*`),
 *   which are validated against session credentials and server-side RBAC rules.
 *
 * Moderation Features:
 * - User impersonation with session refetch and redirection to the application home view.
 * - Targeted session revocation across all active devices for a compromised account.
 * - Toggling account ban status with instant feedback.
 * - Irreversible account deletion guarded by a modal confirmation dialog (`AlertDialog`).
 *
 * @param props - Component properties containing user data and the active admin identifier
 * @returns Table row rendering account status badges, role indicator, and actions menu
 * @author Maruf Bepary
 */
export function UserRow({
  user,
  selfId,
}: {
  user: UserWithRole;
  selfId: string;
}) {
  const { refetch } = authClient.useSession();
  const router = useRouter();
  const isSelf = user.id === selfId;

  // Admin action handlers.
  /**
   * Initiates an administrative impersonation session for the specified target user.
   * On success, refetches the active session state so client hooks reflect the impersonated identity
   * and navigates to the home route.
   *
   * @param userId - Unique identifier of the user to impersonate
   * @author Maruf Bepary
   */
  function handleImpersonateUser(userId: string) {
    authClient.admin.impersonateUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to impersonate");
        },
        onSuccess: () => {
          refetch();
          router.push(ROUTES.HOME);
        },
      },
    );
  }

  /**
   * Suspends access for a target user by applying a ban through the admin API.
   * Dispatches a toast notification and refreshes the server component data upon success.
   *
   * @param userId - Unique identifier of the user account to ban
   * @author Maruf Bepary
   */
  function handleBanUser(userId: string) {
    authClient.admin.banUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to ban user");
        },
        onSuccess: () => {
          toast.success("User banned");
          router.refresh();
        },
      },
    );
  }

  /**
   * Reinstates an account by removing an active ban via the admin API.
   * Dispatches a toast notification and triggers a route refresh on success.
   *
   * @param userId - Unique identifier of the banned user account to restore
   * @author Maruf Bepary
   */
  function handleUnbanUser(userId: string) {
    authClient.admin.unbanUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to unban user");
        },
        onSuccess: () => {
          toast.success("User unbanned");
          router.refresh();
        },
      },
    );
  }

  /**
   * Invalidates all active session tokens associated with the specified user account.
   * Forces the target user to re-authenticate on all connected devices.
   *
   * @param userId - Unique identifier of the user whose sessions will be invalidated
   * @author Maruf Bepary
   */
  function handleRevokeSessions(userId: string) {
    authClient.admin.revokeUserSessions(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to revoke user sessions");
        },
        onSuccess: () => {
          toast.success("User sessions revoked");
        },
      },
    );
  }

  /**
   * Permanently deletes a user account and associated credentials from the database.
   * Invoked only after explicit user confirmation in the alert dialog.
   *
   * @param userId - Unique identifier of the user account to permanently remove
   * @author Maruf Bepary
   */
  function handleRemoveUser(userId: string) {
    authClient.admin.removeUser(
      { userId },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to delete user");
        },
        onSuccess: () => {
          toast.success("User deleted");
          router.refresh();
        },
      },
    );
  }

  return (
    <TableRow key={user.id}>
      <TableCell>
        <div>
          <div className="font-medium">{user.name || "No name"}</div>
          <div className="text-muted-foreground text-sm">{user.email}</div>
          <div className="not-empty:mt-2 flex items-center gap-2">
            {user.banned && <Badge variant="destructive">Banned</Badge>}
            {!user.emailVerified && <Badge variant="outline">Unverified</Badge>}
            {isSelf && <Badge>You</Badge>}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={user.role === GLOBAL_ROLES.ADMIN ? "default" : "secondary"}
        >
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        {!isSelf && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => handleImpersonateUser(user.id)}
                >
                  Impersonate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRevokeSessions(user.id)}>
                  Revoke Sessions
                </DropdownMenuItem>
                {user.banned ? (
                  <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                    Unban User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleBanUser(user.id)}>
                    Ban User
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />

                <AlertDialogTrigger asChild>
                  <DropdownMenuItem variant="destructive">
                    Delete User
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this user? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleRemoveUser(user.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TableCell>
    </TableRow>
  );
}
