import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";

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
export const GET: typeof authHandlers.GET = authHandlers.GET;

/**
 * Universal HTTP POST route handler proxying mutation requests to the Better Auth engine.
 * Handles credential sign-in/sign-up, password reset requests, session revocation/sign-out,
 * 2FA verification challenges, passkey response verification, organization management, and admin actions.
 *
 * @author Maruf Bepary
 */
export const POST: typeof authHandlers.POST = authHandlers.POST;
