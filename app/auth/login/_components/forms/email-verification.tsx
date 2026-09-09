"use client";

import { useEffect, useRef, useState } from "react";
import { BetterAuthActionButton } from "@/components/auth/buttons/better-auth-action-button";
import { authClient } from "@/lib/auth/auth-client";
import { ROUTES } from "@/lib/routes";

/**
 * Guides users through resending their email verification link with a cooldown.
 * @param email Address that should receive the verification email.
 * @returns Email verification helper component.
 */
export function EmailVerification({ email }: { email: string }) {
  const [timeToNextResend, setTimeToNextResend] = useState(30);
  const interval = useRef<NodeJS.Timeout>(undefined);

  /**
   * Starts a countdown that prevents immediate resend spam.
   * @param time Countdown duration in seconds.
   */
  function startEmailVerificationCountdown(time = 30) {
    setTimeToNextResend(time);

    clearInterval(interval.current);
    interval.current = setInterval(() => {
      setTimeToNextResend((t) => {
        const newT = t - 1;

        if (newT <= 0) {
          clearInterval(interval.current);
          return 0;
        }
        return newT;
      });
    }, 1000);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: Initial countdown setup on mount is intentional
  useEffect(() => {
    startEmailVerificationCountdown();
  }, []);

  return (
    <div className="space-y-4">
      <p className="mt-2 text-muted-foreground text-sm">
        We sent you a verification link. Please check your email and click the
        link to verify your account.
      </p>

      <BetterAuthActionButton
        variant="outline"
        className="w-full"
        successMessage="Verification email sent!"
        disabled={timeToNextResend > 0}
        action={() => {
          startEmailVerificationCountdown();
          return authClient.sendVerificationEmail({
            email,
            callbackURL: ROUTES.HOME,
          });
        }}
      >
        {timeToNextResend > 0
          ? `Resend Email (${timeToNextResend})`
          : "Resend Email"}
      </BetterAuthActionButton>
    </div>
  );
}
