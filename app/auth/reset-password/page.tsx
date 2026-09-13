import { Suspense } from "react";
import ResetPasswordForm from "@/app/auth/reset-password/_components/reset-password-form";

/**
 * Page metadata configuration for the password reset route.
 */
export const metadata = {
  title: "Reset Password",
};

/**
 * Server-rendered container page for the password reset workflow.
 * Executes as a React Server Component (RSC) wrapping the client-side reset form
 * in a React `Suspense` boundary to support client search parameter extraction (`useSearchParams`).
 *
 * User Flows & Security Context:
 * - Visitors arrive at this page via an encrypted tokenized link sent to their registered email address.
 * - Delegates query string extraction, token validation, password complexity enforcement, and
 *   credential mutation to the nested `ResetPasswordForm` client component.
 *
 * @returns Server-rendered password reset page wrapping client form in Suspense
 * @author Maruf Bepary
 */
export default function ResetPasswordPage() {
  return (
    <main>
      <Suspense>
        {/* Client component handles useSearchParams and form logic */}
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
