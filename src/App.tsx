import { useState } from "react";
import { ProviderForm } from "@/components/ProviderForm";
import { SuccessScreen } from "@/components/SuccessScreen";
import type { AvailabilityWeek, SubmissionSuccess } from "@/lib/types";

const TFC_LOGO_URL = "https://i.postimg.cc/mDgxQcwq/TFC-Logo-color-1.jpg";

interface SubmittedSummary {
  data: SubmissionSuccess;
  acceptingIndividual: number;
  acceptingCouples: number;
  acceptingFamily: number;
  availability: AvailabilityWeek | null;
}

function App() {
  const [submitted, setSubmitted] = useState<SubmittedSummary | null>(null);
  // Force a re-mount of ProviderForm on reset so internal state clears.
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="min-h-full py-8 sm:py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src={TFC_LOGO_URL}
            alt="The Family Connection"
            className="h-20 w-auto mb-4 mix-blend-multiply"
          />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Provider Availability Update
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Let us know how many new clients you're accepting and your preferred
            scheduling windows. Takes about 1 minute.
          </p>
        </div>

        {submitted ? (
          <SuccessScreen
            data={submitted.data}
            acceptingIndividual={submitted.acceptingIndividual}
            acceptingCouples={submitted.acceptingCouples}
            acceptingFamily={submitted.acceptingFamily}
            availability={submitted.availability}
            onReset={() => {
              setSubmitted(null);
              setFormKey((k) => k + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : (
          <ProviderForm
            key={formKey}
            onSuccess={(data, fields) =>
              setSubmitted({
                data,
                acceptingIndividual: fields.acceptingIndividual,
                acceptingCouples: fields.acceptingCouples,
                acceptingFamily: fields.acceptingFamily,
                availability: fields.availability,
              })
            }
          />
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          The Family Connection · Provider Availability
        </footer>
      </div>
    </div>
  );
}

export default App;
