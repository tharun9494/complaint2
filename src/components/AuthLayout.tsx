import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user && !location.pathname.includes('/auth')) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user && location.pathname.includes('/auth')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}