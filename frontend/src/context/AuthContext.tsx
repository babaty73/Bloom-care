import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getToken, setToken as persistToken, clearToken } from "../utils/api";
import * as authService from "../services/auth.service";
import type {
  AuthenticatedPharmacy,
  AuthenticatedAdmin,
  PharmacyLoginPayload,
  PharmacyRegisterPayload,
  AdminLoginPayload,
  UserRole,
} from "../types/auth.types";

// Contract: docs/ARCHITECTURE.md Frontend token handling.
// AuthContext owns authentication state; components must not read/write
// bloomcare_token or role state directly.

interface AuthState {
  role: UserRole | null;
  pharmacy: AuthenticatedPharmacy | null;
  admin: AuthenticatedAdmin | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

interface AuthContextValue extends AuthState {
  loginPharmacy: (payload: PharmacyLoginPayload) => Promise<void>;
  registerPharmacy: (payload: PharmacyRegisterPayload) => Promise<void>;
  loginAdmin: (payload: AdminLoginPayload) => Promise<void>;
  updatePharmacyState: (pharmacy: AuthenticatedPharmacy) => void;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_STORAGE_KEY = "bloomcare_role";

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
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    if (token && storedRole) {
      setRole(storedRole);
    }
    setIsInitializing(false);
  }, []);

  const loginPharmacy = useCallback(async (payload: PharmacyLoginPayload) => {
    const result = await authService.loginPharmacy(payload);
    persistToken(result.token);
    localStorage.setItem(ROLE_STORAGE_KEY, "pharmacy");
    setRole("pharmacy");
    setPharmacy(result.pharmacy);
  }, []);

  const registerPharmacy = useCallback(async (payload: PharmacyRegisterPayload) => {
    const result = await authService.registerPharmacy(payload);
    persistToken(result.token);
    localStorage.setItem(ROLE_STORAGE_KEY, "pharmacy");
    setRole("pharmacy");
    setPharmacy(result.pharmacy);
  }, []);

  const loginAdmin = useCallback(async (payload: AdminLoginPayload) => {
    const result = await authService.loginAdmin(payload);
    persistToken(result.token);
    localStorage.setItem(ROLE_STORAGE_KEY, "admin");
    setRole("admin");
    setAdmin(result.admin);
  }, []);

  const updatePharmacyState = useCallback((updated: AuthenticatedPharmacy) => {
    setPharmacy(updated);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(ROLE_STORAGE_KEY);
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
      registerPharmacy,
      loginAdmin,
      updatePharmacyState,
      logout,
    }),
    [role, pharmacy, admin, isInitializing, loginPharmacy, registerPharmacy, loginAdmin, updatePharmacyState, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
