"use client";

import { Plus, Shield, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import type { auth } from "@/lib/auth/auth";
import { authClient } from "@/lib/auth/auth-client";
import {
  SUPPORTED_OAUTH_PROVIDER_DETAILS,
  SUPPORTED_OAUTH_PROVIDERS,
  type SupportedOAuthProvider,
} from "@/lib/auth/o-auth-providers";

/**
 * Inferred account representation for user authentication providers.
 */
type Account = Awaited<ReturnType<typeof auth.api.listUserAccounts>>[number];

/**
 * Interactive management panel for connecting and disconnecting third-party OAuth providers.
 * Displays currently linked federated accounts with connection timestamps and unlinking actions.
 * Computes available unlinked social providers from `SUPPORTED_OAUTH_PROVIDERS`, allowing users
 * to link additional authentication providers (e.g. GitHub, Google, Discord) for flexible sign-in.
 *
 * @param props - Component props containing the user's currently linked non-credential accounts
 * @returns Federated identity management interface
 * @author Maruf Bepary
 */
export function AccountLinking({
  currentAccounts,
}: {
  currentAccounts: Account[];
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-medium text-lg">Linked Accounts</h3>

        {currentAccounts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-secondary-muted">
              No linked accounts found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentAccounts.map((account) => (
              <AccountCard
                key={account.id}
                provider={account.providerId}
                account={account}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-lg">Link Other Accounts</h3>
        <div className="grid gap-3">
          {SUPPORTED_OAUTH_PROVIDERS.filter(
            (provider) =>
              !currentAccounts.find((acc) => acc.providerId === provider),
          ).map((provider) => (
            <AccountCard key={provider} provider={provider} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive card representing a single OAuth provider's connection status and action controls.
 * Resolves brand metadata (display name, brand icon) from `SUPPORTED_OAUTH_PROVIDER_DETAILS`.
 * Renders a "Link" action initiating OAuth redirection for unlinked providers, or an "Unlink"
 * destructive action to disconnect an active social login association.
 *
 * @param props - Component props containing the provider key and optional existing account metadata
 * @returns Provider card with connection status and link/unlink action triggers
 * @author Maruf Bepary
 */
function AccountCard({
  provider,
  account,
}: {
  provider: string;
  account?: Account;
}) {
  const router = useRouter();

  const providerDetails = SUPPORTED_OAUTH_PROVIDER_DETAILS[
    provider as SupportedOAuthProvider
  ] ?? {
    // In case of an unsupported provider, use generic details
    name: provider,
    Icon: Shield,
  };

  /**
   * Initiates the OAuth social account linking handshake.
   * Dispatches Better Auth's `linkSocial` API with the specified provider and callback URL,
   * redirecting the browser to the third-party authorization consent screen.
   *
   * @returns Promise resolving when the OAuth redirect begins
   * @author Maruf Bepary
   */
  function linkAccount() {
    return authClient.linkSocial({
      provider,
      callbackURL: ROUTES.PROFILE,
    });
  }

  /**
   * Disconnects an existing social provider from the user's account.
   * Dispatches Better Auth's `unlinkAccount` API with the specific account identifier,
   * removing the third-party identity association and refreshing the router on success.
   *
   * @returns Promise describing the unlink operation result
   * @author Maruf Bepary
   */
  function unlinkAccount() {
    if (account == null) {
      return Promise.resolve({ error: { message: "Account not found" } });
    }
    return authClient.unlinkAccount(
      {
        accountId: account.accountId,
      },
      {
        onSuccess: () => {
          router.refresh();
        },
      },
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {<providerDetails.Icon className="size-5" />}
            <div>
              <p className="font-medium">{providerDetails.name}</p>
              {account == null ? (
                <p className="text-muted-foreground text-sm">
                  Connect your {providerDetails.name} account for easier sign-in
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Linked on {new Date(account.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          {account == null ? (
            <BetterAuthActionButton
              variant="outline"
              size="sm"
              action={linkAccount}
            >
              <Plus />
              Link
            </BetterAuthActionButton>
          ) : (
            <BetterAuthActionButton
              variant="destructive"
              size="sm"
              action={unlinkAccount}
            >
              <Trash2 />
              Unlink
            </BetterAuthActionButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
