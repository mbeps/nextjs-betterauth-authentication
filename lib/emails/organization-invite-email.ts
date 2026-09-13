import { env } from "@/config/env";
import { ROUTES } from "@/config/routes";
import { sendEmail } from "@/lib/emails/send-email";

/**
 * Notifies a user by email that they have been invited to join an organization.
 * Triggered by the Better Auth organization plugin during membership invitations.
 * Builds an invitation action link using application routing helpers and delivers
 * both HTML and text representations prompting the invitee to accept or decline.
 *
 * @param options - Organization invitation dispatch options
 * @param options.invitation - Invitation metadata containing unique invite ID
 * @param options.inviter - Inviting member profile containing display name
 * @param options.organization - Target organization entity details
 * @param options.email - Recipient email address for the invited user
 * @returns Promise resolving upon successful message transmission
 * @throws {Error} When Postmark fails to deliver the invitation email
 * @see ROUTES.ORGANIZATIONS.INVITE for route generation
 * @see sendEmail for the email delivery transport
 * @author Maruf Bepary
 */
export async function sendOrganizationInviteEmail({
  invitation,
  inviter,
  organization,
  email,
}: {
  invitation: { id: string };
  inviter: { name: string };
  organization: { name: string };
  email: string;
}) {
  await sendEmail({
    to: email,
    subject: `You're invited to join the ${organization.name} organization`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're invited to join ${
          organization.name
        }</h2>
        <p>Hello ${inviter.name},</p>
        <p>${inviter.name} invited you to join the ${
          organization.name
        } organization. Please click the button below to accept/reject the invitation:</p>
        <a href="${env.BETTER_AUTH_URL}${ROUTES.ORGANIZATIONS.INVITE(
          invitation.id,
        )}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Manage Invitation</a>
        <p>Best regards,<br>Your App Team</p>
      </div>
    `,
    text: `You're invited to join the ${
      organization.name
    } organization\n\nHello ${inviter.name},\n\n${
      inviter.name
    } invited you to join the ${
      organization.name
    } organization. Please click the link below to accept/reject the invitation:\n\n${
      env.BETTER_AUTH_URL
    }${ROUTES.ORGANIZATIONS.INVITE(
      invitation.id,
    )}\n\nBest regards,\nYour App Team`,
  });
}
