import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card } from 'pixel-retroui';
import { OryForm } from '../components/OryForm';
import * as ory from '../services/ory';
import type { OryFlow } from '../services/ory';

export function Register() {
  const [flow, setFlow] = useState<OryFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const initFlow = async () => {
      try {
        setLoading(true);
        setError(null);
        // Check if we have a flow ID in the URL (continuing an existing flow)
        const flowId = searchParams.get('flow');
        const registrationFlow = await ory.fetchFlow('registration', flowId || undefined);
        setFlow(registrationFlow);
        
        // Update URL with flow ID if not already present
        if (registrationFlow.id && !flowId) {
          setSearchParams({ flow: registrationFlow.id });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load registration form';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initFlow();
  }, [searchParams, setSearchParams]);
    const handleFlowSubmit = async (completedFlow: OryFlow) => {
  // ✅ Detect success properly
  const isSuccess =
    completedFlow.state === "success" ||
    Boolean((completedFlow as any).session) ||
    Boolean((completedFlow as any).redirect_to) ||
    Boolean((completedFlow as any).continue_with?.length);

  if (isSuccess) {
    // 🧹 cleanup
    setSearchParams({});

    // 🚀 go to login
    navigate("/login", { replace: true });
    return;
  }

  // ❌ Still in flow (validation / errors)
  setFlow(completedFlow);

  if (completedFlow.id) {
    setSearchParams({ flow: completedFlow.id });
  }
};



  const handleFlowError = (err: Error) => {
    setError(err.message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
        <Card className="p-6 w-full max-w-md">
          <p className="text-center">Loading registration form...</p>
        </Card>
      </div>
    );
  }

  if (error && !flow) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
        <Card className="p-6 w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2">Register</h1>
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

const nodes = flow?.ui?.nodes ?? [];

const isMultiStep =
  flow?.state === 'choose_method' ||
  (nodes.filter(n => n.attributes.type === 'password').length === 0 &&
   nodes.filter(n => n.attributes.name === 'traits.email').length > 0);


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
      <Card className="p-6 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Register</h1>
        <p className="text-gray-600 mb-6">
          {isMultiStep && !flow?.ui.nodes.some(n => n.attributes.type === 'password')
            ? 'Enter your email to continue'
            : 'Create a new account'}
        </p>

        <OryForm
          flow={flow}
          onSubmit={handleFlowSubmit}
          onError={handleFlowError}
        />

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
