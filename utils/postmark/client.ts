import { ServerClient } from "postmark";
import { env } from "@/config/env";

/**
 * Shared Postmark server client instance.
 * Initialised with the application server API token to authenticate transactional email dispatches.
 * Used across email sending modules for account verification, password resets, and organization invites.
 *
 * @see sendEmail for the primary wrapper around this client
 * @author Maruf Bepary
 */
export const postmarkClient = new ServerClient(env.POSTMARK_SERVER_TOKEN);
