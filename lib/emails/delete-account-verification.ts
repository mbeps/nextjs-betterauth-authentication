import { sendEmail } from "@/lib/emails/send-email";

/**
 * Payload parameters required to dispatch an account deletion confirmation email.
 *
 * @author Maruf Bepary
 */
interface EmailVerificationData {
  /** Target account owner details. */
  user: {
    /** Display name of the user requesting account deletion. */
    name: string;
    /** Destination email address of the account owner. */
    email: string;
  };
  /** Secure confirmation link containing Better Auth deletion validation token. */
  url: string;
}

/**
 * Sends the confirmation email that guards permanent user account deletion.
 * Invoked by Better Auth's user deletion lifecycle hook when a user requests to delete their profile.
 * Ensures intentionality and security by requiring email authorization before irreversibly purging user data.
 *
 * @param data - Payload containing account owner details and deletion confirmation callback URL
 * @param data.user - Account owner recipient details
 * @param data.url - One-time verification link permitting approval of account deletion
 * @returns Promise resolving upon successful message transmission
 * @throws {Error} When Postmark fails to deliver the verification email
 * @see sendEmail for the underlying Postmark email delivery mechanism
 * @author Maruf Bepary
 */
export async function sendDeleteAccountVerificationEmail({
  user,
  url,
}: EmailVerificationData) {
  await sendEmail({
    to: user.email,
    subject: "Delete your account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Confirm Account Deletion</h2>
        <p>Hello ${user.name},</p>
        <p>We're sorry to see you go! Please confirm your account deletion by clicking the button below:</p>
        <a href="${url}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Confirm Deletion</a>
        <p>If you don't have an account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Your App Team</p>
      </div>
    `,
    text: `Hello ${user.name},\n\nWe're sorry to see you go! Please confirm your account deletion by clicking this link: ${url}\n\nIf you don't have an account, please ignore this email.\n\nThis link will expire in 24 hours.\n\nBest regards,\nYour App Team`,
  });
}
