import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from 'pixel-retroui';
import { OryForm } from '../components/OryForm';
import * as ory from '../services/ory';
import type { OryFlow } from '../services/ory';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [flow, setFlow] = useState<OryFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSession } = useAuth();

  const returnTo = searchParams.get('return_to') || '/dashboard';

  useEffect(() => {
    const initFlow = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if user is already authenticated
        const sessionResponse = await ory.whoami();
        if (sessionResponse.session && sessionResponse.session.active) {
          // User is already logged in, redirect to dashboard
          navigate(returnTo, { replace: true });
          return;
        }

        const loginFlow = await ory.fetchFlow('login', undefined, returnTo);
        setFlow(loginFlow);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load login form';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initFlow();
  }, [returnTo, navigate]);

  const handleFlowSubmit = async (completedFlow: OryFlow) => {
  // ✅ If Ory returned a session, login is done
  if (completedFlow.session) {
    // Check if Ory wants to redirect somewhere
    const flowWithRedirect = completedFlow as OryFlow & {
      redirect_to?: string;
      continue_with?: Array<{ redirect_browser_to?: string }>;
    };

    const redirectTo =
      flowWithRedirect.redirect_to ||
      flowWithRedirect.continue_with?.[0]?.redirect_browser_to;

    if (redirectTo) {
      window.location.href = redirectTo;
      return;
    }

    // ✅ Navigate immediately
    navigate(returnTo, { replace: true });
    return;
  }

  // ❌ Otherwise, still in flow (errors, MFA, etc)
  setFlow(completedFlow);
};


  const handleFlowError = (err: Error) => {
    setError(err.message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
        <Card className="p-6 w-full max-w-md">
          <p className="text-center">Loading login form...</p>
        </Card>
      </div>
    );
  }

  if (error && !flow) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
        <Card className="p-6 w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2">Login</h1>
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  if (!flow) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
      <Card className="p-6 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Login</h1>
        <p className="text-gray-600 mb-6">Sign in to your account</p>

        <OryForm
          flow={flow}
          onSubmit={handleFlowSubmit}
          onError={handleFlowError}
        />

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </div>
      </Card>
    </div>
  );
}
