"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Passwordless WebAuthn / FIDO2 Passkey authentication button and autofill coordinator.
 * Executes as a Client Component ("use client") interfacing with Better Auth Passkey client endpoints
 * to handle both conditional UI autofill ceremonies and explicit user-initiated passkey assertions.
 *
 * Security Context & Authentication Flow:
 * - Conditional Autofill: Upon mounting, triggers `authClient.signIn.passkey({ autoFill: true })`.
 *   If the browser supports WebAuthn Conditional UI, credentials saved in system authenticators
 *   (Touch ID, Face ID, Windows Hello, 1Password) can populate the form silently without blocking.
 * - Explicit Sign-In: When clicked, prompts the operating system/browser WebAuthn modal ceremony
 *   via `authClient.signIn.passkey(undefined)`.
 * - Session Transition: On credential verification success, refetches active session context (`refetch()`)
 *   and transitions navigation to `ROUTES.HOME`.
 *
 * @returns Client-rendered button component for passkey authentication
 * @author Maruf Bepary
 */
export function PasskeyButton() {
  const router = useRouter();
  const { refetch } = authClient.useSession();

  // Attempt a silent passkey sign-in when the component mounts.
  useEffect(() => {
    authClient.signIn.passkey(
      { autoFill: true },
      {
        onSuccess() {
          refetch();
          router.push(ROUTES.HOME);
        },
      },
    );
  }, [router, refetch]);

  return (
    <BetterAuthActionButton
      variant="outline"
      className="w-full"
      action={() =>
        authClient.signIn.passkey(undefined, {
          onSuccess() {
            refetch();
            router.push(ROUTES.HOME);
          },
        })
      }
    >
      Use Passkey
    </BetterAuthActionButton>
  );
}
