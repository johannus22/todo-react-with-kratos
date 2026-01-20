import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'pixel-retroui';
import { useAuth } from '../contexts/AuthContext';

export function Logout() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        setLoading(true);
        setError(null);

        // Perform logout using AuthContext
        await logout();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Logout failed';
        setError(errorMessage);
        setLoading(false);

        // Fallback: redirect to login after a delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    performLogout();
  }, [logout, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
        <Card className="p-6 w-full max-w-md">
          <p className="text-center">Logging out...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
        <Card className="p-6 w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2">Logout</h1>
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            {error}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Redirecting to login page...
          </p>
        </Card>
      </div>
    );
  }

  return null;
}
