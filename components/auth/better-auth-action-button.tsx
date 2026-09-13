"use client";

import type { ComponentProps } from "react";
import { ActionButton } from "@/components/ui/action-button";

/**
 * Specialized action button tailored for Better Auth mutation responses.
 * Wraps the generic `ActionButton` component to normalize Better Auth client API return shapes
 * (`{ error: null | { message?: string } }`) into standard success and failure statuses.
 * Automatically handles asynchronous execution state, surfaces success or failure notifications via toast,
 * and maintains accessibility standards such as disabling the button during in-flight requests.
 *
 * @param props - Component props extending ActionButton without 'action', including the Better Auth async action callback and an optional success toast message
 * @returns An ActionButton configured for Better Auth operations
 * @author Maruf Bepary
 */
export function BetterAuthActionButton({
  action,
  successMessage,
  ...props
}: Omit<ComponentProps<typeof ActionButton>, "action"> & {
  action: () => Promise<{ error: null | { message?: string } }>;
  successMessage?: string;
}) {
  return (
    <ActionButton
      {...props}
      action={async () => {
        const res = await action();

        if (res.error) {
          return { error: true, message: res.error.message || "Action failed" };
        } else {
          return { error: false, message: successMessage };
        }
      }}
    />
  );
}
