import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { OryForm } from '../components/OryForm';
import * as ory from '../services/ory';
import type { OryFlow } from '../services/ory';

export function Recovery() {
  const [flow, setFlow] = useState<OryFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const flowId = searchParams.get('flow') || undefined;

  useEffect(() => {
    const initFlow = async () => {
      try {
        setLoading(true);
        setError(null);
        const recoveryFlow = await ory.fetchFlow('recovery', flowId);
        setFlow(recoveryFlow);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recovery form';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initFlow();
  }, [flowId]);

  const handleFlowSubmit = async (
    completedFlow: OryFlow & {
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

    setFlow(completedFlow);
  };

  const handleFlowError = (err: Error) => {
    setError(err.message);
  };

  if (loading) {
    return (
      <div className="page-shell flex items-start sm:items-center justify-center">
        <Card className="p-6 w-full max-w-md">
          <p className="text-center text-gray-700">Loading recovery form...</p>
        </Card>
      </div>
    );
  }

  if (error && !flow) {
    return (
      <div className="page-shell flex items-start sm:items-center justify-center">
        <Card className="p-6 w-full max-w-md">
          <h1 className="text-3xl font-semibold mb-2">Forgot password</h1>
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

  return (
    <div className="page-shell flex items-start sm:items-center justify-center">
      <Card className="p-9 sm:p-11 w-full max-w-md fade-up">
        <div className="flex items-start justify-between gap-5 mb-7">
          <div>
            <span className="page-kicker text-xs text-[#6b5a46]">Account recovery</span>
            <h1 className="text-3xl font-semibold mt-2">Forgot password</h1>
            <p className="text-gray-600 mt-2">
              Enter your email to receive a recovery code.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-[#1f6feb] hover:underline"
          >
            Back to login
          </button>
        </div>

        <OryForm
          flow={flow}
          onSubmit={handleFlowSubmit}
          onError={handleFlowError}
        />
      </Card>
    </div>
  );
}
