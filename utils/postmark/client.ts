import { ServerClient } from "postmark";
import { env } from "@/config/env";

/**
 * Shared Postmark server client instance.
 */
export const postmarkClient = new ServerClient(env.POSTMARK_SERVER_TOKEN);
