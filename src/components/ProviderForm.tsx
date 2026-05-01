import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { selectionToWeek, isWeekEmpty } from "@/lib/availability";
import { submissionPayloadSchema, type SubmissionPayload, type SubmissionSuccess } from "@/lib/types";
import { submitAvailability } from "@/lib/api";

type FieldErrors = Partial<Record<
  "providerEmail" | "acceptingIndividual" | "acceptingCouples" | "acceptingFamily",
  string
>>;

type TopError =
  | { kind: "not_found"; email: string }
  | { kind: "auth" }
  | { kind: "server"; message?: string }
  | { kind: "network"; message: string };

interface ProviderFormProps {
  onSuccess: (
    data: SubmissionSuccess,
    submitted: { acceptingIndividual: number; acceptingCouples: number; acceptingFamily: number; availability: SubmissionPayload["availability"] },
  ) => void;
}

export function ProviderForm({ onSuccess }: ProviderFormProps) {
  const [email, setEmail] = useState("");
  const [individual, setIndividual] = useState<string>("0");
  const [couples, setCouples] = useState<string>("0");
  const [family, setFamily] = useState<string>("0");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<TopError | null>(null);

  const availability = useMemo(() => {
    const week = selectionToWeek(selection);
    return isWeekEmpty(week) ? null : week;
  }, [selection]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setTopError(null);

    const payload = {
      providerEmail: email.trim(),
      acceptingIndividual: toIntOrNaN(individual),
      acceptingCouples: toIntOrNaN(couples),
      acceptingFamily: toIntOrNaN(family),
      availability,
    };

    const parsed = submissionPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          key === "providerEmail" ||
          key === "acceptingIndividual" ||
          key === "acceptingCouples" ||
          key === "acceptingFamily"
        ) {
          if (!errs[key]) errs[key] = issue.message;
        }
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
          acceptingIndividual: parsed.data.acceptingIndividual,
          acceptingCouples: parsed.data.acceptingCouples,
          acceptingFamily: parsed.data.acceptingFamily,
          availability: parsed.data.availability,
        });
        return;
      case "validation_error": {
        const errs: FieldErrors = {};
        for (const issue of result.issues) {
          const key = issue.path[0];
          if (
            key === "providerEmail" ||
            key === "acceptingIndividual" ||
            key === "acceptingCouples" ||
            key === "acceptingFamily"
          ) {
            if (!errs[key]) errs[key] = issue.message;
          }
        }
        if (Object.keys(errs).length === 0) {
          setTopError({ kind: "server", message: "The server flagged the submission as invalid. Please review and try again." });
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

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {topError ? <TopErrorAlert error={topError} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Who you are</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider-email">Your TFC email address</Label>
            <Input
              id="provider-email"
              type="email"
              autoComplete="email"
              placeholder="firstname@tfc.health"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={fieldErrors.providerEmail ? true : undefined}
              aria-describedby={fieldErrors.providerEmail ? "email-error" : "email-help"}
              disabled={submitting}
            />
            {fieldErrors.providerEmail ? (
              <p id="email-error" className="text-sm text-destructive">
                {fieldErrors.providerEmail}
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
        <CardHeader>
          <CardTitle>How many new clients are you accepting?</CardTitle>
          <CardDescription>
            Enter 0 for any type you're not accepting right now. You can update this anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CountField
              id="count-individual"
              label="Individual"
              value={individual}
              onChange={setIndividual}
              error={fieldErrors.acceptingIndividual}
              disabled={submitting}
            />
            <CountField
              id="count-couples"
              label="Couples"
              value={couples}
              onChange={setCouples}
              error={fieldErrors.acceptingCouples}
              disabled={submitting}
            />
            <CountField
              id="count-family"
              label="Family"
              value={family}
              onChange={setFamily}
              error={fieldErrors.acceptingFamily}
              disabled={submitting}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle>When are you available?</CardTitle>
              <CardDescription>
                Click and drag across the grid to mark times you're available. Click selected blocks to remove them. This helps us schedule clients into slots that work for you.
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Optional, but helpful
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AvailabilityGrid selection={selection} onChange={setSelection} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selection.size === 0
                ? "No times selected"
                : `${selection.size} half-hour ${selection.size === 1 ? "block" : "blocks"} selected`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={selection.size === 0 || submitting}
              onClick={() => setSelection(new Set())}
            >
              Clear selection
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
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

function CountField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error: string | undefined;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={disabled}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TopErrorAlert({ error }: { error: TopError }) {
  let title: string;
  let body: string;
  switch (error.kind) {
    case "not_found":
      title = "We couldn't find that provider";
      body = `We don't recognize ${error.email}. If you think this is wrong, please contact Lane or Amanda.`;
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

function toIntOrNaN(s: string): number {
  const trimmed = s.trim();
  if (trimmed === "") return NaN;
  if (!/^-?\d+$/.test(trimmed)) return NaN;
  return Number(trimmed);
}
