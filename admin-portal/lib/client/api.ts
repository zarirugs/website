export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init?.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      "Connection lost. Check your internet connection and try again. Your entries are still here.",
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status === 401 && !path.startsWith("/api/auth/")
        ? "Your session has expired. Sign in again before saving."
        : (result?.error ??
            "The request could not be completed. Please try again."),
      response.status,
    );
  if (!result)
    throw new Error(
      "The server returned an unexpected response. Please try again.",
    );
  return result as T;
}
