import { headers } from "next/headers";
import { AccountLinking } from "@/app/profile/_components/account/account-linking";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth/auth";

/**
 * Inferred account representation for user authentication providers.
 */
type Account = Awaited<ReturnType<typeof auth.api.listUserAccounts>>[number];

/**
 * Server-rendered tab view querying linked external authentication providers.
 * Communicates with Better Auth's `listUserAccounts` API to retrieve all associated identity accounts.
 * Filters out internal credential-based password entries, isolating federated OAuth providers
 * (e.g., GitHub, Google, Discord) and passing them to interactive account linking controls.
 *
 * @returns Card layout embedding federated identity linking and unlinking controls
 * @author Maruf Bepary
 */
export async function LinkedAccountsTab() {
  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });
  const nonCredentialAccounts = accounts.filter(
    (account: Account) => account.providerId !== "credential",
  );

  return (
    <Card>
      <CardContent>
        <AccountLinking currentAccounts={nonCredentialAccounts} />
      </CardContent>
    </Card>
  );
}
