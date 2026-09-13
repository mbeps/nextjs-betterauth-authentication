"use client";

import type { Session } from "better-auth";
import { Monitor, Smartphone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { UAParser } from "ua-parser-js";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Interactive session management interface displaying current and remote device sessions.
 * Categorizes active sessions by comparing token identifiers against the active session token.
 * Renders parsed device metadata for the active browser session, alongside a list of remote sessions
 * with individual and bulk revocation controls to safeguard accounts against unauthorized access.
 *
 * @param props - Component props containing user sessions and the active session token
 * @returns Session management dashboard with single and bulk revocation controls
 * @author Maruf Bepary
 */
export function SessionManagement({
  sessions,
  currentSessionToken,
}: {
  sessions: Session[];
  currentSessionToken: string;
}) {
  const router = useRouter();

  const otherSessions = sessions.filter((s) => s.token !== currentSessionToken);
  const currentSession = sessions.find((s) => s.token === currentSessionToken);

  /**
   * Revokes all active sessions across devices except the current session.
   * Dispatches Better Auth's `revokeOtherSessions` API, terminating remote sessions
   * and triggering a router refresh to update active session lists.
   *
   * @returns Promise resolving when remote sessions have been revoked
   * @author Maruf Bepary
   */
  function revokeOtherSessions() {
    return authClient.revokeOtherSessions(undefined, {
      onSuccess: () => {
        router.refresh();
      },
    });
  }

  return (
    <div className="space-y-6">
      {currentSession && (
        <SessionCard session={currentSession} isCurrentSession />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">Other Active Sessions</h3>
          {otherSessions.length > 0 && (
            <BetterAuthActionButton
              variant="destructive"
              size="sm"
              action={revokeOtherSessions}
            >
              Revoke Other Sessions
            </BetterAuthActionButton>
          )}
        </div>

        {otherSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No other active sessions
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {otherSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Visual card displaying individual session metadata, client device characteristics, and revocation actions.
 * Parses the session's user agent string using `ua-parser-js` to extract browser and operating system details,
 * dynamically selecting device icons (mobile vs. desktop). Renders creation and expiration timestamps,
 * badges the active browser session, and provides single-session revocation buttons for remote sessions.
 *
 * @param props - Component props containing the session object and current session indicator
 * @returns Session card displaying parsed device details and revocation controls
 * @author Maruf Bepary
 */
function SessionCard({
  session,
  isCurrentSession = false,
}: {
  session: Session;
  isCurrentSession?: boolean;
}) {
  const router = useRouter();
  const userAgentInfo = session.userAgent ? UAParser(session.userAgent) : null;

  /**
   * Generates a descriptive device string from parsed user-agent data.
   * Combines browser and operating system labels, or falls back to "Unknown Device".
   *
   * @returns Human-readable device description string
   * @author Maruf Bepary
   */
  function getBrowserInformation() {
    if (userAgentInfo == null) return "Unknown Device";
    if (userAgentInfo.browser.name == null && userAgentInfo.os.name == null) {
      return "Unknown Device";
    }

    if (userAgentInfo.browser.name == null) return userAgentInfo.os.name;
    if (userAgentInfo.os.name == null) return userAgentInfo.browser.name;

    return `${userAgentInfo.browser.name}, ${userAgentInfo.os.name}`;
  }

  /**
   * Formats a session timestamp into a localized medium date and short time string.
   *
   * @param date - Date object or ISO timestamp string to format
   * @returns Localized date and time string
   * @author Maruf Bepary
   */
  function formatDate(date: Date) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  /**
   * Terminates this specific session token via Better Auth.
   * Invokes `authClient.revokeSession` with the target session token, invalidating its cookie/token on the server.
   *
   * @returns Promise resolving upon session revocation
   * @author Maruf Bepary
   */
  function revokeSession() {
    return authClient.revokeSession(
      {
        token: session.token,
      },
      {
        onSuccess: () => {
          router.refresh();
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <CardTitle>{getBrowserInformation()}</CardTitle>
        {isCurrentSession && <Badge>Current Session</Badge>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userAgentInfo?.device.type === "mobile" ? (
              <Smartphone />
            ) : (
              <Monitor />
            )}
            <div>
              <p className="text-muted-foreground text-sm">
                Created: {formatDate(session.createdAt)}
              </p>
              <p className="text-muted-foreground text-sm">
                Expires: {formatDate(session.expiresAt)}
              </p>
            </div>
          </div>
          {!isCurrentSession && (
            <BetterAuthActionButton
              variant="destructive"
              size="sm"
              action={revokeSession}
              successMessage="Session revoked"
            >
              <Trash2 />
            </BetterAuthActionButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
