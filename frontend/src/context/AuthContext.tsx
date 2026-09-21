import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getToken, setToken as persistToken, clearToken, getStoredRole, setStoredRole, clearStoredRole } from "../utils/api";
import * as authService from "../services/auth.service";
import type {
  AuthenticatedPharmacy,
  AuthenticatedAdmin,
  PharmacyLoginPayload,
  AdminLoginPayload,
  UserRole,
} from "../types/auth.types";

// Contract: docs/ARCHITECTURE.md Frontend token handling.
// AuthContext owns authentication state; components must not read/write
// bloomcare_token or role state directly. Role storage itself lives in
// utils/api.ts (the shared API layer) so the session-expiry handling there can
// read/clear it without a second, duplicate copy of this storage logic.
//
// NOTE: pharmacy registration is deliberately NOT session-creating (Pharmacy
// Verification — see docs/IMPLEMENTATION_DECISIONS.md). It no longer returns
// a token, so it has no corresponding method here; RegisterPage.tsx calls
// authService.registerPharmacy directly instead of going through this context.

interface AuthState {
  role: UserRole | null;
  pharmacy: AuthenticatedPharmacy | null;
  admin: AuthenticatedAdmin | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

interface AuthContextValue extends AuthState {
  loginPharmacy: (payload: PharmacyLoginPayload) => Promise<void>;
  loginAdmin: (payload: AdminLoginPayload) => Promise<void>;
  updatePharmacyState: (pharmacy: AuthenticatedPharmacy) => void;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [pharmacy, setPharmacy] = useState<AuthenticatedPharmacy | null>(null);
  const [admin, setAdmin] = useState<AuthenticatedAdmin | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // MVP: we only persist the token + role locally. On reload we know a session
    // exists, but re-fetching the full profile is left to each protected page via
    // its own data-loading (loading/error/empty/success) handling.
    const token = getToken();
    const storedRole = getStoredRole() as UserRole | null;
    if (token && storedRole) {
      setRole(storedRole);
    }
    setIsInitializing(false);
  }, []);

  const loginPharmacy = useCallback(async (payload: PharmacyLoginPayload) => {
    const result = await authService.loginPharmacy(payload);
    persistToken(result.token);
    setStoredRole("pharmacy");
    setRole("pharmacy");
    setPharmacy(result.pharmacy);
  }, []);

  const loginAdmin = useCallback(async (payload: AdminLoginPayload) => {
    const result = await authService.loginAdmin(payload);
    persistToken(result.token);
    setStoredRole("admin");
    setRole("admin");
    setAdmin(result.admin);
  }, []);

  const updatePharmacyState = useCallback((updated: AuthenticatedPharmacy) => {
    setPharmacy(updated);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearStoredRole();
    setRole(null);
    setPharmacy(null);
    setAdmin(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      pharmacy,
      admin,
      isAuthenticated: role !== null,
      isInitializing,
      loginPharmacy,
      loginAdmin,
      updatePharmacyState,
      logout,
    }),
    [role, pharmacy, admin, isInitializing, loginPharmacy, loginAdmin, updatePharmacyState, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
