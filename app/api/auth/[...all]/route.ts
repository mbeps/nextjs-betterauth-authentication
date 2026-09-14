import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";
import { getLogger } from "@/lib/logger";

const log = getLogger(["app", "api", "auth"]);

/**
 * Next.js App Router route handler adapter generated from the Better Auth server configuration.
 * Dispatches all authentication, authorization, session, OAuth, passkey, 2FA, and administrative
 * endpoints under the `/api/auth/*` route segment.
 */
const authHandlers = toNextJsHandler(auth);

/**
 * Universal HTTP GET route handler proxying incoming requests to the Better Auth engine.
 * Handles session queries, OAuth provider redirect handshakes and callbacks, email verification links,
 * and passkey authentication options retrieval.
 *
 * @author Maruf Bepary
 */
export const GET: typeof authHandlers.GET = async (request) => {
  const path = new URL(request.url).pathname;
  log.debug("Incoming Auth GET request: {path}", { path });
  return authHandlers.GET(request);
};

/**
 * Universal HTTP POST route handler proxying mutation requests to the Better Auth engine.
 * Handles credential sign-in/sign-up, password reset requests, session revocation/sign-out,
 * 2FA verification challenges, passkey response verification, organization management, and admin actions.
 *
 * @author Maruf Bepary
 */
export const POST: typeof authHandlers.POST = async (request) => {
  const path = new URL(request.url).pathname;
  log.debug("Incoming Auth POST request: {path}", { path });
  return authHandlers.POST(request);
};
