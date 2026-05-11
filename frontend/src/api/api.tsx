export const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  console.log("FETCH_BASE:", import.meta.env.VITE_API_URL);
  
// Use relative URLs in dev so requests go through the Vite proxy (avoids CORS).
// In production, VITE_API_URL should be set to the backend origin.
const FETCH_BASE = import.meta.env.VITE_API_URL ?? "";

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const res = await fetch(`${FETCH_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message ?? message;
    } catch {}
    throw new Error(message);
  }

  // For endpoints that return no JSON
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}