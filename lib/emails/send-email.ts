import { env } from "@/config/env";
import { postmarkClient } from "@/utils/postmark/client";

/**
 * Sends a transactional email through the configured Postmark client.
 * @param to Recipient email address.
 * @param subject Message subject line.
 * @param html HTML content rendered in rich clients.
 * @param text Plain-text fallback content.
 * @returns Promise that resolves with Postmark's API response.
 * @see https://postmarkapp.com/developer
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
