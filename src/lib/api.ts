import type { SubmissionPayload, SubmitResult } from "./types";

interface ApiConfig {
  baseUrl: string;
  apiKey: string;
}

function readConfig(): ApiConfig | { error: string } {
  const baseUrl = import.meta.env.VITE_CRM_API_URL;
  const apiKey = import.meta.env.VITE_PROVIDER_FORM_API_KEY;
  if (!baseUrl || !apiKey) {
    return {
      error:
        "App is not fully configured. VITE_CRM_API_URL and VITE_PROVIDER_FORM_API_KEY must be set at build time.",
    };
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

export async function submitAvailability(
  payload: SubmissionPayload,
): Promise<SubmitResult> {
  const config = readConfig();
  if ("error" in config) {
    return { status: "server_error", message: config.error };
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/api/provider-availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Provider-Form-Key": config.apiKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      status: "network_error",
      message:
        err instanceof Error ? err.message : "Could not reach the server.",
    };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 200 && body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (b.success === true && typeof b.providerEmail === "string" && typeof b.providerName === "string") {
      return {
        status: "success",
        data: {
          success: true,
          providerEmail: b.providerEmail,
          providerName: b.providerName,
          submittedAt: typeof b.submittedAt === "string" ? b.submittedAt : new Date().toISOString(),
        },
      };
    }
    return { status: "server_error", message: "Unexpected response shape from server." };
  }

  if (response.status === 400 && body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const issues = Array.isArray(b.issues) ? (b.issues as Array<Record<string, unknown>>) : [];
    return {
      status: "validation_error",
      issues: issues.map((iss) => ({
        path: Array.isArray(iss.path) ? (iss.path as (string | number)[]) : [],
        message: typeof iss.message === "string" ? iss.message : "Invalid value",
        code: typeof iss.code === "string" ? iss.code : undefined,
      })),
    };
  }

  if (response.status === 404 && body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    return {
      status: "not_found",
      email: typeof b.email === "string" ? b.email : payload.providerEmail,
    };
  }

  if (response.status === 401 || response.status === 403) {
    return { status: "auth_error" };
  }

  return {
    status: "server_error",
    message: `Server returned ${response.status}.`,
  };
}
