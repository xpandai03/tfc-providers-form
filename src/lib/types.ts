import { z } from "zod";

export const availabilityBlockSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "start must be HH:MM"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "end must be HH:MM"),
});

export const availabilityWeekSchema = z.object({
  mon: z.array(availabilityBlockSchema),
  tue: z.array(availabilityBlockSchema),
  wed: z.array(availabilityBlockSchema),
  thu: z.array(availabilityBlockSchema),
  fri: z.array(availabilityBlockSchema),
});

export const submissionPayloadSchema = z.object({
  providerEmail: z
    .string()
    .trim()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
  acceptingIndividual: z
    .number({ invalid_type_error: "Enter a whole number (0 or more)" })
    .int("Enter a whole number")
    .nonnegative("Must be 0 or more"),
  acceptingCouples: z
    .number({ invalid_type_error: "Enter a whole number (0 or more)" })
    .int("Enter a whole number")
    .nonnegative("Must be 0 or more"),
  acceptingFamily: z
    .number({ invalid_type_error: "Enter a whole number (0 or more)" })
    .int("Enter a whole number")
    .nonnegative("Must be 0 or more"),
  availability: availabilityWeekSchema.nullable(),
});

export type AvailabilityBlock = z.infer<typeof availabilityBlockSchema>;
export type AvailabilityWeek = z.infer<typeof availabilityWeekSchema>;
export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>;

export type WeekdayKey = keyof AvailabilityWeek;
export const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
];

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
