import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submissionPayloadSchema,
  SPECIAL_CONSIDERATIONS_MAX,
  type SubmissionSuccess,
} from "@/lib/types";
import { submitAvailability } from "@/lib/api";

type FieldKey = "email" | "acceptingClients" | "specialConsiderations";
type FieldErrors = Partial<Record<FieldKey, string>>;

type TopError =
  | { kind: "not_found"; email: string }
  | { kind: "auth" }
  | { kind: "server"; message?: string }
  | { kind: "network"; message: string };

interface SubmittedFields {
  acceptingClients: number;
  specialConsiderations?: string;
}

interface ProviderFormProps {
  onSuccess: (data: SubmissionSuccess, submitted: SubmittedFields) => void;
}

export function ProviderForm({ onSuccess }: ProviderFormProps) {
  const [email, setEmail] = useState("");
  const [acceptingClients, setAcceptingClients] = useState<string>("0");
  const [specialConsiderations, setSpecialConsiderations] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<TopError | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setTopError(null);

    const trimmedConsiderations = specialConsiderations.trim();
    const payload = {
      providerEmail: email.trim(),
      acceptingClients: toIntOrNaN(acceptingClients),
      specialConsiderations: trimmedConsiderations === "" ? undefined : trimmedConsiderations,
    };

    const parsed = submissionPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = pathToFieldKey(issue.path[0]);
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    const result = await submitAvailability(parsed.data);
    setSubmitting(false);

    switch (result.status) {
      case "success":
        onSuccess(result.data, {
          acceptingClients: parsed.data.acceptingClients,
          specialConsiderations: parsed.data.specialConsiderations,
        });
        return;
      case "validation_error": {
        const errs: FieldErrors = {};
        for (const issue of result.issues) {
          const key = pathToFieldKey(issue.path[0]);
          if (key && !errs[key]) errs[key] = issue.message;
        }
        if (Object.keys(errs).length === 0) {
          setTopError({
            kind: "server",
            message: "The server flagged the submission as invalid. Please review and try again.",
          });
        } else {
          setFieldErrors(errs);
        }
        return;
      }
      case "not_found":
        setTopError({ kind: "not_found", email: result.email });
        return;
      case "auth_error":
        // eslint-disable-next-line no-console
        console.error("[provider-form] Auth error from CRM — VITE_PROVIDER_FORM_API_KEY is wrong or missing in this build.");
        setTopError({ kind: "auth" });
        return;
      case "server_error":
        setTopError({ kind: "server", message: result.message });
        return;
      case "network_error":
        setTopError({ kind: "network", message: result.message });
        return;
    }
  };

  const considerationsLen = specialConsiderations.length;
  const considerationsOver = considerationsLen > SPECIAL_CONSIDERATIONS_MAX;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {topError ? <TopErrorAlert error={topError} /> : null}

      <Card>
        <CardHeader className="text-center items-center">
          <CardTitle>Who you are</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center">
            <Label htmlFor="provider-email">Your TFC email address</Label>
            <Input
              id="provider-email"
              type="email"
              autoComplete="email"
              placeholder="firstname@tfc.health"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? "email-error" : "email-help"}
              disabled={submitting}
              className="text-center"
            />
            {fieldErrors.email ? (
              <p id="email-error" className="text-sm text-destructive">
                {fieldErrors.email}
              </p>
            ) : (
              <p id="email-help" className="text-sm text-muted-foreground">
                This is how we identify you in the system. Use the email TFC uses to contact you (typically firstname@tfc.health).
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-center items-center">
          <CardTitle>Your availability</CardTitle>
          <CardDescription>
            Tell us how many new clients you're accepting and anything we should know when matching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2 text-center">
            <Label htmlFor="accepting-clients">How many new clients are you accepting?</Label>
            <Input
              id="accepting-clients"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={acceptingClients}
              onChange={(e) => setAcceptingClients(e.target.value)}
              aria-invalid={fieldErrors.acceptingClients ? true : undefined}
              aria-describedby={
                fieldErrors.acceptingClients ? "accepting-clients-error" : "accepting-clients-help"
              }
              disabled={submitting}
              className="sm:max-w-[160px] mx-auto text-center"
            />
            {fieldErrors.acceptingClients ? (
              <p id="accepting-clients-error" className="text-sm text-destructive">
                {fieldErrors.acceptingClients}
              </p>
            ) : (
              <p id="accepting-clients-help" className="text-sm text-muted-foreground">
                Enter 0 if you're full right now. You can update this anytime.
              </p>
            )}
          </div>

          <div className="space-y-2 text-center">
            <Label htmlFor="special-considerations">
              Special considerations <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="special-considerations"
              placeholder="e.g. prefer afternoon clients, no new trauma intakes for the next month"
              value={specialConsiderations}
              onChange={(e) => setSpecialConsiderations(e.target.value)}
              maxLength={SPECIAL_CONSIDERATIONS_MAX}
              aria-invalid={fieldErrors.specialConsiderations ? true : undefined}
              aria-describedby={
                fieldErrors.specialConsiderations
                  ? "special-considerations-error"
                  : "special-considerations-help"
              }
              disabled={submitting}
              rows={4}
            />
            <div
              className={
                considerationsOver
                  ? "text-xs text-destructive"
                  : "text-xs text-muted-foreground"
              }
              aria-live="polite"
            >
              {considerationsLen} / {SPECIAL_CONSIDERATIONS_MAX}
            </div>
            {fieldErrors.specialConsiderations ? (
              <p id="special-considerations-error" className="text-sm text-destructive">
                {fieldErrors.specialConsiderations}
              </p>
            ) : (
              <p id="special-considerations-help" className="text-sm text-muted-foreground">
                Anything the team should know when matching clients to you (preferences, capacity nuances, time-bound notes).
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center space-y-2 text-center">
        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Submitting…" : "Submit availability"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Your submission overwrites your previous availability. We'll send you a confirmation email.
        </p>
      </div>
    </form>
  );
}

function TopErrorAlert({ error }: { error: TopError }) {
  let title: string;
  let body: string;
  switch (error.kind) {
    case "not_found":
      title = "We couldn't find that provider";
      body = `We don't recognize ${error.email}. If you think this is wrong, please contact Lane or Raunek.`;
      break;
    case "auth":
      title = "Something went wrong";
      body = "We couldn't authenticate this form with the server. Please try again, or contact Lane if it keeps happening.";
      break;
    case "server":
      title = "Something went wrong on our end";
      body = error.message ?? "Please try again in a minute, or contact Lane if it keeps happening.";
      break;
    case "network":
      title = "Couldn't reach the server";
      body = "Check your connection and try again.";
      break;
  }
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{body}</AlertDescription>
    </Alert>
  );
}

// Map a Zod issue path (which uses wire-format names like `providerEmail`)
// back to the UI-side field key used in fieldErrors.
function pathToFieldKey(head: string | number | undefined): FieldKey | null {
  if (head === "providerEmail") return "email";
  if (head === "acceptingClients") return "acceptingClients";
  if (head === "specialConsiderations") return "specialConsiderations";
  return null;
}

function toIntOrNaN(s: string): number {
  const trimmed = s.trim();
  if (trimmed === "") return NaN;
  if (!/^-?\d+$/.test(trimmed)) return NaN;
  return Number(trimmed);
}
