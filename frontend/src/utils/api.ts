// Shared HTTP client. Contract: docs/ARCHITECTURE.md — pages/components must not
// implement their own fetch/axios calls; domain services call these helpers only.
// Response envelope: ApiSuccess<T> / ApiError, matching the backend contract exactly.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_STORAGE_KEY = "bloomcare_token";

export interface ApiErrorShape {
  code: string;
  details: string[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  error: ApiErrorShape;
}

export class ApiRequestError extends Error {
  code: string;
  details: string[];
  status: number;

  constructor(status: number, code: string, message: string, details: string[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  auth?: boolean; // attach Authorization header when true (default true)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content has no JSON body
  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiErrorResponse | null;

  if (!response.ok || !json || json.success === false) {
    const errorJson = json as ApiErrorResponse | null;
    throw new ApiRequestError(
      response.status,
      errorJson?.error?.code || "INTERNAL_SERVER_ERROR",
      errorJson?.message || "Something went wrong",
      errorJson?.error?.details || [],
    );
  }

  return json.data;
}
