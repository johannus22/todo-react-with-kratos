import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { OryForm } from '../components/OryForm';
import * as ory from '../services/ory';
import { normalizeUrl } from '../services/ory';
import type { OryFlow, OrySession } from '../services/ory';

export function Login() {
  const [flow, setFlow] = useState<OryFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawReturnTo = searchParams.get('return_to') || '/dashboard';
  const returnTo = (() => {
    try {
      const url = new URL(rawReturnTo, window.location.origin);
      url.searchParams.delete('flow');
      return `${url.pathname}${url.search}`;
    } catch {
      return rawReturnTo.split('?')[0];
    }
  })();
  const flowId = searchParams.get('flow') || undefined;

  useEffect(() => {
    const initFlow = async () => {
      try {
        setLoading(true);
        setError(null);

        // Only check session if we are not resuming an existing flow
        if (!flowId) {
          const sessionResponse = await ory.whoami();
          if (sessionResponse.redirect_browser_to) {
            window.location.href = normalizeUrl(sessionResponse.redirect_browser_to);
            return;
          }
          if (sessionResponse.session && sessionResponse.session.active) {
            // User is already logged in, redirect to dashboard
            navigate(returnTo, { replace: true });
            return;
          }
        }

        const loginFlow = await ory.fetchFlow('login', flowId, returnTo, false);
        setFlow(loginFlow);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load login form';
        if (errorMessage.toLowerCase().includes('already logged in')) {
          navigate(returnTo, { replace: true });
          return;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initFlow();
  }, [returnTo, flowId, navigate]);

  const handleFlowSubmit = async (
    completedFlow: OryFlow & {
      session?: OrySession;
      redirect_to?: string;
      continue_with?: Array<{ redirect_browser_to?: string }>;
    }
  ) => {
    const redirectTo =
      completedFlow.redirect_to ||
      completedFlow.continue_with?.[0]?.redirect_browser_to;

    if (redirectTo) {
      window.location.href = redirectTo;
      return;
    }

    // If Ory returned a session, login is done
    if (completedFlow.session) {
      // Navigate immediately
      navigate(returnTo, { replace: true });
      return;
    }

    // Otherwise, still in flow (errors, MFA, etc)
    setFlow(completedFlow);
  };

  const handleFlowError = (err: Error) => {
    setError(err.message);
  };

  if (loading) {
    return (
      <div className="page-shell flex items-start sm:items-center justify-center">
        <Card className="p-6 w-full max-w-md">
          <p className="text-center text-gray-700">Loading login form...</p>
        </Card>
      </div>
    );
  }

  if (error && !flow) {
    return (
      <div className="page-shell flex items-start sm:items-center justify-center">
        <Card className="p-6 w-full max-w-md">
          <h1 className="text-3xl font-semibold mb-2">Login</h1>
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-[#1f6feb] text-white rounded hover:bg-[#1a56c4]"
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

  const alreadyLoggedIn = flow.ui?.messages?.some(
    (msg) => msg.text?.toLowerCase().includes('already logged in')
  );

  if (alreadyLoggedIn) {
    window.location.href = returnTo;
    return null;
  }

  return (
    <div className="page-shell flex items-start sm:items-center justify-center">
      <Card className="p-9 sm:p-11 padding-have w-full max-w-md fade-up">
        <span className="page-kicker text-xs text-[#6b5a46]">Welcome back</span>
        <h1 className="text-3xl font-semibold mt-2">Login</h1>
        <p className="text-gray-600 mb-7">Sign in to pick up where you left off.</p>

        <OryForm
          flow={flow}
          onSubmit={handleFlowSubmit}
          onError={handleFlowError}
        />

        <div className="mt-4 text-center padding-have text-sm">
          <Link to="/recovery" className="text-[#1f6feb] hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link to="/register" className="text-[#1f6feb] hover:underline">
            Register
          </Link>
        </div>
      </Card>
    </div>
  );
}
