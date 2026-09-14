import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { desc, eq } from "drizzle-orm";
import { env } from "@/config/env";
import { db } from "@/drizzle/db";
import { member } from "@/drizzle/schema";
import { ac, admin, user } from "@/lib/auth/permissions";
import { GLOBAL_ROLES } from "@/lib/auth/roles";
import { sendDeleteAccountVerificationEmail } from "@/lib/emails/delete-account-verification";
import { sendEmailVerificationEmail } from "@/lib/emails/email-verification";
import { sendOrganizationInviteEmail } from "@/lib/emails/organization-invite-email";
import { sendPasswordResetEmail } from "@/lib/emails/password-reset-email";
import { sendWelcomeEmail } from "@/lib/emails/welcome-email";
import { getLogger } from "@/lib/logger";

const log = getLogger(["app", "auth"]);

/**
 * Basic user profile payload required for sending email notifications.
 */
type EmailUser = {
  /** Recipient display name. */
  name: string;
  /** Recipient email address. */
  email: string;
};

/**
 * Payload provided by Better Auth when requesting email address change confirmation.
 */
type ChangeEmailPayload = {
  /** Current user profile data. */
  user: EmailUser;
  /** Verification callback URL with token. */
  url: string;
  /** New unverified email address to be confirmed. */
  newEmail: string;
};

/**
 * Generic email payload provided by Better Auth for single-user verification workflows.
 */
type UserEmailPayload = {
  /** Target user recipient. */
  user: EmailUser;
  /** Verification or action callback URL. */
  url: string;
};

/**
 * Payload provided by the Better Auth organization plugin when dispatching invitation emails.
 */
type OrganizationInvitePayload = {
  /** Invited member's destination email address. */
  email: string;
  /** Target organization details. */
  organization: {
    /** Name of the inviting organization. */
    name: string;
  };
  /** Inviting user information. */
  inviter: {
    user: {
      /** Display name of the user who issued the invitation. */
      name: string;
    };
  };
  /** Generated invitation token metadata. */
  invitation: {
    /** Unique invitation identifier. */
    id: string;
  };
};

/**
 * Session persistence payload processed during session creation database hooks.
 */
type SessionCreatePayload = {
  /** Identifier of the user establishing a new session. */
  userId: string;
} & Record<string, unknown>;

/**
 * Central Better Auth server instance configured with Drizzle ORM and authentication plugins.
 * Encapsulates credentials authentication, OAuth (GitHub, Discord), Passkeys, Two-Factor Authentication (2FA),
 * multi-tenant Organizations, and Role-Based Access Control (RBAC).
 * Uses JWT-based stateless sessions stored in encrypted HTTP-only cookies with automatic session refresh.
 *
 * @see {@link https://docs.better-auth.com}
 * @author Maruf Bepary
 */
export const auth = betterAuth({
  appName: "Better Auth Demo",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({
        user,
        url,
        newEmail,
      }: ChangeEmailPayload) => {
        log.info("Email change confirmation requested");
        await sendEmailVerificationEmail({
          user: { ...user, email: newEmail },
          url,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({
        user,
        url,
      }: UserEmailPayload) => {
        log.info("Account deletion verification requested");
        await sendDeleteAccountVerificationEmail({ user, url });
      },
    },
    additionalFields: {
      favoriteNumber: {
        type: "number",
        required: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }: UserEmailPayload) => {
      log.info("Password reset email requested");
      await sendPasswordResetEmail({ user, url });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }: UserEmailPayload) => {
      log.info("Verification email requested");
      await sendEmailVerificationEmail({ user, url });
    },
  },
  socialProviders: {
    github: {
      clientId: env.CLIENT_ID_GITHUB,
      clientSecret: env.CLIENT_SECRET_GITHUB,
      mapProfileToUser: (profile: {
        public_repos?: number | string | null;
      }) => {
        return {
          favoriteNumber: Number(profile.public_repos) || 0,
        };
      },
    },
    discord: {
      clientId: env.CLIENT_ID_DISCORD,
      clientSecret: env.CLIENT_SECRET_DISCORD,
      mapProfileToUser: () => {
        return {
          favoriteNumber: 0,
        };
      },
    },
  },
  session: {
    // JWT-based stateless sessions with encrypted cookies
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh session token every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days cache duration
      strategy: "jwt", // JWT tokens for session validation
    },
  },
  plugins: [
    nextCookies(),
    twoFactor(),
    passkey(),
    adminPlugin({
      ac,
      roles: {
        [GLOBAL_ROLES.ADMIN]: admin,
        [GLOBAL_ROLES.USER]: user,
      },
    }),
    organization({
      sendInvitationEmail: async ({
        email,
        organization,
        inviter,
        invitation,
      }: OrganizationInvitePayload) => {
        log.info("Organization invitation email requested (org: {orgName})", {
          orgName: organization.name,
        });
        await sendOrganizationInviteEmail({
          invitation,
          inviter: inviter.user,
          organization,
          email,
        });
      },
    }),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        const user = ctx.context.newSession?.user ?? {
          name: ctx.body.name,
          email: ctx.body.email,
        };

        if (user != null) {
          log.info("New user registered successfully");
          await sendWelcomeEmail(user);
        }
      }
    }),
  },
  databaseHooks: {
    session: {
      create: {
        before: async (userSession: SessionCreatePayload) => {
          log.debug(
            "Resolving active organization for user session (userId: {userId})",
            { userId: userSession.userId },
          );
          const membership = await db.query.member.findFirst({
            where: eq(member.userId, userSession.userId),
            orderBy: desc(member.createdAt),
            columns: { organizationId: true },
          });

          return {
            data: {
              ...userSession,
              activeOrganizationId: membership?.organizationId,
            },
          };
        },
      },
    },
  },
});
