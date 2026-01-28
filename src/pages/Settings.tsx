import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { OryForm } from '../components/OryForm';
import * as ory from '../services/ory';
import type { OryFlow, UINode } from '../services/ory';

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
      <div className="page-shell flex items-start sm:items-center justify-center">
        <Card className="p-6 w-full max-w-md">
          <p className="text-center text-gray-700">Loading settings...</p>
        </Card>
      </div>
    );
  }

  if (error && !flow) {
    return (
      <div className="page-shell flex items-start sm:items-center justify-center">
        <Card className="p-6 w-full max-w-md">
          <h1 className="text-3xl font-semibold mb-2">Settings</h1>
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

  const getSettingsNodes = (nodes: UINode[]): UINode[] => {
    return nodes.filter((node) => {
      const name = node.attributes.name || '';
      const group = node.group || '';
      const isHidden = node.type === 'input' && node.attributes.type === 'hidden';
      const isSubmit = node.type === 'input' && node.attributes.type === 'submit';
      const submitValue = node.attributes.value || '';
      const isMfaSubmit =
        isSubmit &&
        (submitValue.includes('totp') ||
          submitValue.includes('otp') ||
          submitValue.includes('mfa') ||
          submitValue.includes('webauthn'));
      const isMfaNode =
        name.includes('totp') ||
        name.includes('otp') ||
        name.includes('mfa') ||
        name.includes('webauthn') ||
        group.includes('totp') ||
        group.includes('webauthn');

      return isHidden || (!isMfaNode && !isMfaSubmit);
    });
  };

  const settingsNodes = getSettingsNodes(flow.ui.nodes);
  const settingsFlow: OryFlow = {
    ...flow,
    ui: {
      ...flow.ui,
      nodes: settingsNodes,
    },
  };

  return (
    <div className="page-shell flex items-start sm:items-center justify-center">
      <Card className="p-9 sm:p-11 lg:p-12 w-full max-w-lg fade-up">
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <span className="page-kicker text-xs text-[#6b5a46]">Account</span>
            <h1 className="text-3xl font-semibold mt-2">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account settings.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium text-[#1f6feb] hover:underline"
          >
            Back to dashboard
          </button>
        </div>

        <OryForm
          flow={settingsFlow}
          onSubmit={handleFlowSubmit}
          onError={handleFlowError}
          requirePasswordConfirmation
          requirePasswordStrength
          singleSubmit
        />
      </Card>
    </div>
  );
}
