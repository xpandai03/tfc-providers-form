import { useState } from "react";
import { ProviderForm } from "@/components/ProviderForm";
import { SuccessScreen } from "@/components/SuccessScreen";
import type { SubmissionSuccess } from "@/lib/types";

const TFC_LOGO_URL = "https://i.postimg.cc/mDgxQcwq/TFC-Logo-color-1.jpg";

interface SubmittedSummary {
  data: SubmissionSuccess;
  acceptingClients: number;
  specialConsiderations?: string;
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
            Let us know how many new clients you're accepting and anything we
            should know when matching. Takes under a minute.
          </p>
        </div>

        {submitted ? (
          <SuccessScreen
            data={submitted.data}
            acceptingClients={submitted.acceptingClients}
            specialConsiderations={submitted.specialConsiderations}
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
                acceptingClients: fields.acceptingClients,
                specialConsiderations: fields.specialConsiderations,
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
