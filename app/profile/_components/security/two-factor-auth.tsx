"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth/auth-client";
import { type QrForm, qrSchema } from "@/schemas/two-factor/qr.schema";
import {
  type TwoFactorAuthForm,
  twoFactorAuthSchema,
} from "@/schemas/two-factor/two-factor-auth.schema";

/**
 * Provisioning payload containing TOTP configuration and emergency recovery codes.
 */
type TwoFactorData = {
  /**
   * Standardized otpauth:// URI encoded into the QR code for authenticator apps.
   */
  totpURI: string;
  /**
   * One-time backup recovery codes for bypassing TOTP in emergency scenarios.
   */
  backupCodes: string[];
};

/**
 * Interactive management component for configuring TOTP two-factor authentication.
 * Dynamically toggles between enabling and disabling states based on current 2FA status.
 * Requires password verification before modifying security state. When enabling, requests a
 * new TOTP secret from Better Auth and transitions into the interactive QR code verification workflow.
 *
 * @param props - Component props indicating whether two-factor authentication is currently active
 * @returns Form for toggling 2FA or QR code verification flow
 * @author Maruf Bepary
 */
export function TwoFactorAuth({ isEnabled }: { isEnabled: boolean }) {
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(
    null,
  );
  const router = useRouter();
  const form = useForm<TwoFactorAuthForm>({
    resolver: zodResolver(twoFactorAuthSchema),
    defaultValues: { password: "" },
  });

  const { isSubmitting } = form.formState;

  /**
   * Disables two-factor authentication after verifying the user's password.
   * Calls Better Auth's `twoFactor.disable` endpoint, clearing 2FA requirements and refreshing session state.
   *
   * @param data - Form values containing the user's account password
   * @author Maruf Bepary
   */
  async function handleDisableTwoFactorAuth(data: TwoFactorAuthForm) {
    await authClient.twoFactor.disable(
      {
        password: data.password,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to disable 2FA");
        },
        onSuccess: () => {
          form.reset();
          router.refresh();
        },
      },
    );
  }

  /**
   * Initiates two-factor authentication enablement by verifying the user's password.
   * Calls Better Auth's `twoFactor.enable` endpoint to generate a TOTP secret, URI, and backup codes.
   *
   * @param data - Form values containing the user's account password
   * @author Maruf Bepary
   */
  async function handleEnableTwoFactorAuth(data: TwoFactorAuthForm) {
    const result = await authClient.twoFactor.enable({
      password: data.password,
    });

    if (result.error) {
      toast.error(result.error.message || "Failed to enable 2FA");
      return;
    }

    if (result.data && "totpURI" in result.data) {
      setTwoFactorData(result.data);
      form.reset();
    }
  }

  if (twoFactorData != null) {
    return (
      <QRCodeVerify
        {...twoFactorData}
        onDone={() => {
          setTwoFactorData(null);
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(
          isEnabled ? handleDisableTwoFactorAuth : handleEnableTwoFactorAuth,
        )}
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          variant={isEnabled ? "destructive" : "default"}
        >
          <LoadingSwap isLoading={isSubmitting}>
            {isEnabled ? "Disable 2FA" : "Enable 2FA"}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}

/**
 * Step-by-step QR code verification subflow and emergency recovery code display.
 * Generates a scannable QR code from the `totpURI` (as well as an extracted plaintext secret for manual entry).
 * Prompts the user to enter a 6-digit TOTP token to verify synchronization before activating 2FA.
 * Once verified via `verifyTotp`, surfaces emergency backup recovery codes for safe keeping.
 *
 * @param props - Component props containing TOTP URI, backup codes array, and completion callback
 * @returns Verification form and backup code view
 * @author Maruf Bepary
 */
function QRCodeVerify({
  totpURI,
  backupCodes,
  onDone,
}: TwoFactorData & { onDone: () => void }) {
  const [successfullyEnabled, setSuccessfullyEnabled] = useState(false);
  const router = useRouter();
  const form = useForm<QrForm>({
    resolver: zodResolver(qrSchema),
    defaultValues: { token: "" },
  });

  const { isSubmitting } = form.formState;

  /**
   * Verifies the submitted TOTP token against Better Auth to finalize 2FA enrollment.
   * On success, reveals emergency recovery backup codes and refreshes the router.
   *
   * @param data - Form values containing the 6-digit TOTP token
   * @author Maruf Bepary
   */
  async function handleQrCode(data: QrForm) {
    await authClient.twoFactor.verifyTotp(
      {
        code: data.token,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to verify code");
        },
        onSuccess: () => {
          setSuccessfullyEnabled(true);
          router.refresh();
        },
      },
    );
  }

  if (successfullyEnabled) {
    return (
      <>
        <p className="mb-2 text-muted-foreground text-sm">
          Save these backup codes in a safe place. You can use them to access
          your account.
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <div key={index} className="font-mono text-sm">
              {code}
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={onDone}>
          Done
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Scan this QR code with your authenticator app and enter the code below:
      </p>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleQrCode)}>
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            <LoadingSwap isLoading={isSubmitting}>Submit Code</LoadingSwap>
          </Button>
        </form>
      </Form>
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4">
          <QRCode size={256} value={totpURI} />
        </div>
        <div className="text-center">
          <p className="mb-2 text-muted-foreground text-sm">
            Or enter this code manually:
          </p>
          <code className="break-all rounded bg-muted px-2 py-1 font-mono text-sm">
            {new URL(totpURI).searchParams.get("secret")}
          </code>
        </div>
      </div>
    </div>
  );
}
