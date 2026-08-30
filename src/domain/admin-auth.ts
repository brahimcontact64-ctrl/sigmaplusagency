import { z } from "zod";

export const adminLoginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1).max(200),
  })
  .strict();

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export type LoginState = { error?: string } | undefined;

/**
 * "Sensible minimum strength" per the brief: length plus a letter and a
 * digit. Deliberately not a byzantine complexity policy — length is
 * the dominant factor in real-world password strength, and an internal
 * tool with rate-limited login and a single-use scratch password
 * doesn't need more than this to close the actual risk.
 */
export const newPasswordSchema = z
  .string()
  .min(12, "Must be at least 12 characters.")
  .max(200)
  .regex(/[a-zA-Z]/, "Must contain at least one letter.")
  .regex(/[0-9]/, "Must contain at least one number.");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1),
  })
  .strict();

export type ChangePasswordState = { error?: string; success?: boolean } | undefined;
