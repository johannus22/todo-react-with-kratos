import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from 'pixel-retroui';
import { OryForm } from '../components/OryForm';
import * as ory from '../services/ory';
import type { OryFlow } from '../services/ory';

export function Settings() {
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
        const settingsFlow = await ory.fetchFlow('settings', flowId);
        setFlow(settingsFlow);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load settings form';
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
        <Card className="p-6 w-full max-w-md">
          <p className="text-center">Loading settings...</p>
        </Card>
      </div>
    );
  }

  if (error && !flow) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
        <Card className="p-6 w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
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
      <Card className="p-10 w-1/2 max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account settings.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to dashboard
          </button>
        </div>

        <OryForm
          flow={flow}
          onSubmit={handleFlowSubmit}
          onError={handleFlowError}
          showPasswordToggles
          requirePasswordConfirmation
          requirePasswordStrength
          singleSubmit
        />
      </Card>
    </div>
  );
}
