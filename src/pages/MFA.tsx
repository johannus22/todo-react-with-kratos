import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { OryForm } from '../components/OryForm';
import * as ory from '../services/ory';
import type { OryFlow, UINode } from '../services/ory';
import { useAuth } from '../contexts/AuthContext';

export function MFA() {
  const [flow, setFlow] = useState<OryFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { checkSession } = useAuth();

  useEffect(() => {
    const initFlow = async () => {
      try {
        setLoading(true);
        setError(null);
        const settingsFlow = await ory.fetchFlow('settings');
        setFlow(settingsFlow);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load MFA settings';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initFlow();
  }, []);

  const handleFlowSubmit = async (completedFlow: OryFlow) => {
    // Check if flow was successful
    if (completedFlow.state === 'success' || !completedFlow.ui.messages?.some(m => m.type === 'error')) {
      // Refresh session to get updated MFA status
      await checkSession();
      // Update flow to show new state
      setFlow(completedFlow);
    } else {
      // Update flow with new state (may have new errors or continue flow)
      setFlow(completedFlow);
    }
  };

  const handleFlowError = (err: Error) => {
    setError(err.message);
  };

  // Filter nodes for TOTP/OTP related functionality
  const getMfaNodes = (nodes: UINode[]): UINode[] => {
    return nodes.filter((node) => {
      const name = node.attributes.name || '';
      const group = node.group || '';
      const isHidden = node.type === 'input' && node.attributes.type === 'hidden';
      const isSubmit = node.type === 'input' && node.attributes.type === 'submit';
      const submitValue = node.attributes.value || '';
      const isTotpSubmit = isSubmit && (submitValue.includes('totp') || submitValue.includes('otp'));
      return (
        isHidden ||
        name.includes('totp') ||
        name.includes('otp') ||
        name.includes('mfa') ||
        name.includes('webauthn') ||
        group.includes('totp') ||
        group.includes('webauthn') ||
        isTotpSubmit
      );
    });
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div className="max-w-3xl mx-auto">
          <Card className="p-6">
            <p className="text-center text-gray-700">Loading MFA settings...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !flow) {
    return (
      <div className="page-shell">
        <div className="max-w-3xl mx-auto">
          <Card className="p-6">
            <h1 className="text-3xl font-semibold mb-2">Multi-Factor Authentication</h1>
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
            <Button className="bg-[#1f6feb] hover:bg-[#1a56c4] text-white" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!flow) {
    return null;
  }

  // Filter flow to only show MFA-related nodes
  const mfaNodes = getMfaNodes(flow.ui.nodes);
  const hasMfaNodes = mfaNodes.length > 0;

  // Create a filtered flow for display
  const mfaFlow: OryFlow = {
    ...flow,
    ui: {
      ...flow.ui,
      nodes: hasMfaNodes ? mfaNodes : flow.ui.nodes,
    },
  };

  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card className="p-8 sm:p-10 fade-up">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="page-kicker text-xs text-[#6b5a46]">Security</span>
              <h1 className="text-3xl font-semibold mt-2">Multi-Factor Authentication</h1>
              <p className="text-gray-600 mt-2">
                Manage your two-factor authentication settings.
              </p>
            </div>
            <Button
              className="bg-[#1f6feb] hover:bg-[#1a56c4] text-white"
              onClick={() => navigate('/todos')}
            >
              Back to Todos
            </Button>
          </div>
        </Card>

        <Card className="p-8 sm:p-10 fade-up">
          {hasMfaNodes ? (
            <OryForm
              flow={mfaFlow}
              onSubmit={handleFlowSubmit}
              onError={handleFlowError}
            />
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                No MFA options available. This may require additional configuration in Ory Kratos.
              </p>
              <p className="text-sm text-gray-500">
                Available groups: {Array.from(new Set(flow.ui.nodes.map(n => n.group))).join(', ')}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
