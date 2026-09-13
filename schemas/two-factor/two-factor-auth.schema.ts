import z from "zod";

export const twoFactorAuthSchema = z.object({
  password: z.string().min(1),
});

export type TwoFactorAuthForm = z.infer<typeof twoFactorAuthSchema>;
