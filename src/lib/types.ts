import { z } from "zod";

export const SPECIAL_CONSIDERATIONS_MAX = 500;
export const ACCEPTING_CLIENTS_MAX = 50;

export const submissionPayloadSchema = z.object({
  providerEmail: z
    .string()
    .trim()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
  acceptingClients: z
    .number({ invalid_type_error: "Enter a whole number (0 or more)" })
    .int("Enter a whole number")
    .min(0, "Must be 0 or more")
    .max(ACCEPTING_CLIENTS_MAX, `Must be ${ACCEPTING_CLIENTS_MAX} or fewer`),
  specialConsiderations: z
    .string()
    .trim()
    .max(SPECIAL_CONSIDERATIONS_MAX, `Keep it under ${SPECIAL_CONSIDERATIONS_MAX} characters`)
    .optional(),
});

export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>;

export interface SubmissionSuccess {
  success: true;
  providerEmail: string;
  providerName: string;
  submittedAt: string;
}

export interface ZodIssue {
  path: (string | number)[];
  message: string;
  code?: string;
}

export type SubmitResult =
  | { status: "success"; data: SubmissionSuccess }
  | { status: "validation_error"; issues: ZodIssue[] }
  | { status: "not_found"; email: string }
  | { status: "auth_error" }
  | { status: "server_error"; message?: string }
  | { status: "network_error"; message: string };
