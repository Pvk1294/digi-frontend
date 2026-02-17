import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // 🔥 WAIT for auth initialization
  if (isLoading) {
    return null; // or loading spinner
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const isAuthorized = allowedRoles.includes(user.role);

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;