// Shared HTTP client. Contract: docs/ARCHITECTURE.md — pages/components must not
// implement their own fetch/axios calls; domain services call these helpers only.
// Response envelope: ApiSuccess<T> / ApiError, matching the backend contract exactly.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_STORAGE_KEY = "bloomcare_token";
const ROLE_STORAGE_KEY = "bloomcare_role";

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

// Role storage lives here (the shared API layer) rather than in AuthContext, so
// the session-expiry handling below can read/clear it without duplicating a
// second copy of this storage logic in another file.
export function getStoredRole(): string | null {
  return localStorage.getItem(ROLE_STORAGE_KEY);
}

export function setStoredRole(role: string): void {
  localStorage.setItem(ROLE_STORAGE_KEY, role);
}

export function clearStoredRole(): void {
  localStorage.removeItem(ROLE_STORAGE_KEY);
}

function loginPathForRole(role: string | null): string {
  if (role === "pharmacy") return "/pharmacy/login";
  if (role === "admin") return "/admin/login";
  return "/";
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

    // Session/token handling (shared here, not duplicated per page): a 401 on a
    // request that attached a bearer token means that token is dead — expired,
    // invalidated, or otherwise no longer accepted. This never fires for
    // auth: false calls (public search/details/report, login/register itself),
    // so a wrong-password login attempt is unaffected. A 403 (role/ownership
    // mismatch) is a different, legitimate case and is NOT treated as session
    // expiry here.
    if (auth && response.status === 401) {
      const activeRole = getStoredRole();
      clearToken();
      clearStoredRole();
      const loginPath = loginPathForRole(activeRole);
      window.location.href = `${loginPath}?sessionExpired=1`;
    }

    throw new ApiRequestError(
      response.status,
      errorJson?.error?.code || "INTERNAL_SERVER_ERROR",
      errorJson?.message || "Something went wrong",
      errorJson?.error?.details || [],
    );
  }

  return json.data;
}
