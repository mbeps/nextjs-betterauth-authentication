import { sendEmail } from "@/lib/emails/send-email";

/**
 * Greets newly registered users with an introductory welcome email after successful sign-up.
 * Dispatched automatically from Better Auth post-registration lifecycle hooks (`/sign-up`).
 * Delivers formatted HTML and plain-text greeting messages.
 *
 * @param user - Newly registered user profile details
 * @param user.name - Recipient user display name
 * @param user.email - Recipient user destination email address
 * @returns Promise resolving upon successful message transmission
 * @throws {Error} When Postmark fails to deliver the welcome email
 * @see sendEmail for the email delivery transport
 * @author Maruf Bepary
 */
export async function sendWelcomeEmail(user: { name: string; email: string }) {
  await sendEmail({
    to: user.email,
    subject: "Welcome to Our App!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Our App!</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for signing up for our app! We're excited to have you on board.</p>
        <p>Best regards,
        <br>
        Your App Team</p>
      </div>
    `,
    text: `Hello ${user.name},\n\nThank you for signing up for our app! We're excited to have you on board.\n\nBest regards,\nYour App Team`,
  });
}
