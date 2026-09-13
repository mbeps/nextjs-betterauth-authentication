import { headers } from "next/headers";
import { SessionManagement } from "@/app/profile/_components/session/session-management";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth/auth";

/**
 * Server-rendered session overview fetching active login sessions across devices.
 * Communicates with Better Auth's `listSessions` API to retrieve active sessions associated with the user,
 * identifying the active session token to differentiate the current browser from remote devices.
 * Renders the session management card containing device details and revocation controls.
 *
 * @param props - Component props containing the token for the currently active session
 * @returns Card container embedding interactive session management controls
 * @author Maruf Bepary
 */
export async function SessionsTab({
  currentSessionToken,
}: {
  currentSessionToken: string;
}) {
  const sessions = await auth.api.listSessions({ headers: await headers() });

  return (
    <Card>
      <CardContent>
        <SessionManagement
          sessions={sessions}
          currentSessionToken={currentSessionToken}
        />
      </CardContent>
    </Card>
  );
}
