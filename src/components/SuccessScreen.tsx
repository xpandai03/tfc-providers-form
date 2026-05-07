import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SubmissionSuccess } from "@/lib/types";

interface SuccessScreenProps {
  data: SubmissionSuccess;
  acceptingClients: number;
  specialConsiderations?: string;
  onReset: () => void;
}

export function SuccessScreen({
  data,
  acceptingClients,
  specialConsiderations,
  onReset,
}: SuccessScreenProps) {
  const headline =
    acceptingClients === 0
      ? "Got it — we'll pause new assignments to you for now."
      : `We've recorded that you're accepting ${acceptingClients} new ${
          acceptingClients === 1 ? "client" : "clients"
        }.`;

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
            <p className="text-muted-foreground">{headline}</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-foreground/80 mb-2">
              Accepting new clients
            </h3>
            <div className="rounded-md border border-border p-3 bg-muted/30 inline-block min-w-[120px]">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-2xl font-semibold">{acceptingClients}</div>
            </div>
          </section>

          {specialConsiderations ? (
            <section>
              <h3 className="text-sm font-semibold text-foreground/80 mb-2">
                Special considerations
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md border border-border p-3 bg-muted/30">
                {specialConsiderations}
              </p>
            </section>
          ) : null}
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
