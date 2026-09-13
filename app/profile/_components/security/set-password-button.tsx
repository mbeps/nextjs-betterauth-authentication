"use client";

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Action button that initiates a password establishment flow for OAuth-only accounts.
 * Dispatches Better Auth's `requestPasswordReset` method with the user's email address and redirect target.
 * Triggers a transactional password-reset email containing a time-limited token, allowing OAuth users
 * to establish password credentials for their account without needing a prior password.
 *
 * @param props - Component props containing the user's email address
 * @returns Interactive button wired to Better Auth's password reset endpoint
 * @author Maruf Bepary
 */
export function SetPasswordButton({ email }: { email: string }) {
  return (
    <BetterAuthActionButton
      variant="outline"
      successMessage="Password reset email sent"
      action={() => {
        return authClient.requestPasswordReset({
          email,
          redirectTo: "/auth/reset-password",
        });
      }}
    >
      Send Password Reset Email
    </BetterAuthActionButton>
  );
}
