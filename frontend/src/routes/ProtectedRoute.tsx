import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth.types";
import Loading from "../components/common/Loading";

interface ProtectedRouteProps {
  allowedRole: UserRole;
  redirectTo: string;
}

// Contract: docs/ARCHITECTURE.md — frontend route guards are UX/navigation
// protection only. Backend authorization is the real security boundary.
function ProtectedRoute({ allowedRole, redirectTo }: ProtectedRouteProps) {
  const { role, isInitializing } = useAuth();

  if (isInitializing) {
    return <Loading label="Checking session..." />;
  }

  if (role !== allowedRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
