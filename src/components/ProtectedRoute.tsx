import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, checkSession } = useAuth();
  const location = useLocation();

  // Check session on mount if not already checked
  useEffect(() => {
    if (!loading && !user) {
      checkSession();
    }
  }, [loading, user, checkSession]);

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?return_to=${returnTo}`} replace />;
  }

  return <>{children}</>;
}
