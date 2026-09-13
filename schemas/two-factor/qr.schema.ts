import z from "zod";

export const qrSchema = z.object({
  token: z.string().length(6),
});

export type QrForm = z.infer<typeof qrSchema>;
