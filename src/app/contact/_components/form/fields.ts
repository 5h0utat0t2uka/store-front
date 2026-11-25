import { EMAIL_MAX_LENGTH } from "@/lib/email";

export const limits = { email: EMAIL_MAX_LENGTH, subject: 120, body: 5000 } as const;
export type ContactFields = Record<keyof typeof limits, string>;
