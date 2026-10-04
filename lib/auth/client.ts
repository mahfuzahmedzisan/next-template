/** Browser-safe helper for calling this app's own `/api/auth/*` BFF routes. */
export type AuthApiError = {
  message: string;
  errors?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
  details?: { message?: string };
};

export async function postAuthApi<T>(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: AuthApiError }> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = (await response.json().catch(() => null)) as
      (T & AuthApiError) | null;

    if (!response.ok) {
      return {
        ok: false,
        error: (json as AuthApiError) ?? { message: "Request failed" },
      };
    }

    return { ok: true, data: json as T };
  } catch {
    return {
      ok: false,
      error: { message: "Unable to reach the authentication service." },
    };
  }
}

/** First message worth showing the user from a failed auth API call. */
export function firstAuthErrorMessage(error: AuthApiError): string {
  const fieldMessage = Object.values(error.errors?.fieldErrors ?? {})[0]?.[0];
  const formMessage = error.errors?.formErrors?.[0];
  return error.details?.message ?? fieldMessage ?? formMessage ?? error.message;
}
