import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AvailabilityWeek, SubmissionSuccess } from "@/lib/types";
import { WEEKDAYS } from "@/lib/types";
import { formatBlockLabel, isWeekEmpty } from "@/lib/availability";

interface SuccessScreenProps {
  data: SubmissionSuccess;
  acceptingIndividual: number;
  acceptingCouples: number;
  acceptingFamily: number;
  availability: AvailabilityWeek | null;
  onReset: () => void;
}

export function SuccessScreen({
  data,
  acceptingIndividual,
  acceptingCouples,
  acceptingFamily,
  availability,
  onReset,
}: SuccessScreenProps) {
  const weekEmpty = !availability || isWeekEmpty(availability);

  return (
    <Card className="animate-fade-in">
      <CardContent className="pt-8 pb-6">
        <div className="flex items-start gap-4">
          <CheckCircle2
            className="h-8 w-8 text-emerald-600 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Thanks, {data.providerName}!
            </h2>
            <p className="text-muted-foreground">
              Your availability has been updated. The TFC team will use this for
              new client matches going forward.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-foreground/80 mb-2">
              New clients you're accepting
            </h3>
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border border-border p-3 bg-muted/30">
                <dt className="text-xs text-muted-foreground">Individual</dt>
                <dd className="text-lg font-semibold">{acceptingIndividual}</dd>
              </div>
              <div className="rounded-md border border-border p-3 bg-muted/30">
                <dt className="text-xs text-muted-foreground">Couples</dt>
                <dd className="text-lg font-semibold">{acceptingCouples}</dd>
              </div>
              <div className="rounded-md border border-border p-3 bg-muted/30">
                <dt className="text-xs text-muted-foreground">Family</dt>
                <dd className="text-lg font-semibold">{acceptingFamily}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground/80 mb-2">
              Scheduling windows
            </h3>
            {weekEmpty ? (
              <p className="text-sm text-muted-foreground">
                No specific windows submitted.
              </p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {WEEKDAYS.map(({ key, label }) => {
                  const blocks = availability?.[key] ?? [];
                  if (blocks.length === 0) return null;
                  return (
                    <li key={key} className="flex gap-3">
                      <span className="font-medium text-foreground/80 w-12 shrink-0">
                        {label}
                      </span>
                      <span className="text-muted-foreground">
                        {blocks.map((b) => formatBlockLabel(b.start, b.end)).join(", ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Submitted {formatTimestamp(data.submittedAt)}
          </span>
          <Button variant="ghost" onClick={onReset}>
            Submit another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
