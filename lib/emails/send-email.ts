import { env } from "@/config/env";
import { postmarkClient } from "@/utils/postmark/client";

/**
 * Sends a transactional email through the configured Postmark client.
 * Serves as the central email dispatch utility invoked across all authentication lifecycle events,
 * including email verification, password reset, account deletion, and team invites.
 * Automatically injects the verified application sender address configured in environment variables.
 *
 * @param options - Email dispatch configuration options
 * @param options.to - Recipient email address
 * @param options.subject - Subject line of the email message
 * @param options.html - Rich HTML message body rendered in modern mail clients
 * @param options.text - Plain-text fallback message body for text-only clients
 * @returns Promise resolving to Postmark's delivery response object
 * @throws {Error} When the Postmark API request fails or network connectivity is lost
 * @see {@link https://postmarkapp.com/developer}
 * @see postmarkClient for client initialization
 * @author Maruf Bepary
 */
export function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  return postmarkClient.sendEmail({
    From: env.POSTMARK_FROM_EMAIL,
    To: to,
    Subject: subject,
    HtmlBody: html,
    TextBody: text,
  });
}
