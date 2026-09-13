"use client";

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Danger zone action component initiating permanent account termination.
 * Employs a confirmation prompt (`requireAreYouSure`) to prevent accidental clicks before
 * dispatching Better Auth's `deleteUser` mutation with a callback URL. Triggers a transactional
 * confirmation email with a signed link, ensuring that permanent account deletion requires explicit
 * out-of-band email authorization before user data, credentials, and sessions are purged.
 *
 * @returns Destructive action button initiating the email-confirmed account deletion flow
 * @author Maruf Bepary
 */
export function AccountDeletion() {
  return (
    <BetterAuthActionButton
      requireAreYouSure
      variant="destructive"
      className="w-full"
      successMessage="Account deletion initiated. Please check your email to confirm."
      action={() => authClient.deleteUser({ callbackURL: ROUTES.HOME })}
    >
      Delete Account Permanently
    </BetterAuthActionButton>
  );
}
