import { useState, useEffect, useMemo, Fragment } from 'react';
import type { FormEvent } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { OryFlow, UINode, OryMessage } from '../services/ory';
import * as ory from '../services/ory';

interface OryFormProps {
  flow: OryFlow;
  onSubmit?: (flow: OryFlow) => void;
  onError?: (error: Error) => void;
  loading?: boolean;
  requirePasswordConfirmation?: boolean;
  requirePasswordStrength?: boolean;
  singleSubmit?: boolean;
}

export function OryForm({
  flow,
  onSubmit,
  onError,
  loading: externalLoading,
  requirePasswordConfirmation = false,
  requirePasswordStrength = false,
  singleSubmit = false,
}: OryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nodes = useMemo(() => flow?.ui?.nodes ?? [], [flow]);
  const nodesWithIndex = useMemo(
    () => nodes.map((node, index) => ({ node, index })),
    [nodes]
  );
  const groupedNodesWithIndex = useMemo(() => {
    return nodesWithIndex.reduce((acc, item) => {
      const group = item.node.group || 'default';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {} as Record<string, Array<{ node: UINode; index: number }>>);
  }, [nodesWithIndex]);
  const submitIndexes = useMemo(
    () =>
      nodes
        .map((node, idx) =>
          node.type === 'input' && node.attributes.type === 'submit' ? idx : -1
        )
        .filter((idx) => idx >= 0),
    [nodes]
  );
  const preferredSubmitIndex = useMemo(() => {
    if (!singleSubmit) return -1;
    const submitCandidates = nodes
      .map((node, idx) => {
        if (!(node.type === 'input' && node.attributes.type === 'submit')) {
          return null;
        }
        const label =
          node.attributes.label?.text ||
          node.meta?.label?.text ||
          node.attributes.value ||
          '';
        return { idx, label, value: node.attributes.value || '' };
      })
      .filter((item): item is { idx: number; label: string; value: string } => Boolean(item));

    const saveLike = submitCandidates.filter((item) => {
      const text = `${item.label} ${item.value}`.toLowerCase();
      return text.includes('save');
    });

    if (saveLike.length > 0) {
      return saveLike[saveLike.length - 1].idx;
    }

    return -1;
  }, [nodes, singleSubmit]);
  const lastSubmitIndex = submitIndexes.length
    ? submitIndexes[submitIndexes.length - 1]
    : -1;
  const passwordFieldName = useMemo(() => {
    const passwordNode = nodes.find(
      (node) => node.type === 'input' && node.attributes.type === 'password'
    );
    return passwordNode?.attributes.name ?? '';
  }, [nodes]);
  const hasPasswordNode = useMemo(
    () => nodes.some((node) => node.type === 'input' && node.attributes.type === 'password'),
    [nodes]
  );
  const isRecoveryFlow = flow?.type === 'recovery';
  const confirmPasswordFieldName = 'confirm_password';

  // Initialize form data from flow nodes
useEffect(() => {
  if (!nodes.length) return;

  const initialData: Record<string, string> = {};
  nodes.forEach((node) => {
    if (node.attributes.name && node.attributes.value) {
      initialData[node.attributes.name] = String(node.attributes.value);
    }
  });

  setFormData((prev) => {
    const same =
      JSON.stringify(prev) === JSON.stringify(initialData);

    return same ? prev : initialData;
  });
}, [nodes]);



  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

  };

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  setErrors({});

  try {
    if (requirePasswordConfirmation && passwordFieldName) {
      const passwordValue = formData[passwordFieldName] || '';
      const confirmValue = formData[confirmPasswordFieldName] || '';

      if (!confirmValue) {
        setErrors({ [confirmPasswordFieldName]: 'Please confirm your password.' });
        setLoading(false);
        return;
      }

      if (passwordValue !== confirmValue) {
        setErrors({ [confirmPasswordFieldName]: 'Passwords do not match.' });
        setLoading(false);
        return;
      }
    }

    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;

    const body: Record<string, any> = {};

    // 1️⃣ Collect all nodes from Ory
    nodes.forEach((node) => {
      if (node.type === "input" && node.attributes.name) {
        const name = node.attributes.name;

        if (node.attributes.type === "submit") {
          if (submitter && submitter.name === name) {
            body[name] = submitter.value;
          } else if (!submitter && body[name] === undefined) {
            // Fallback for Enter key submits: pick the first submit value.
            body[name] = node.attributes.value ?? "";
          }
        } else {
          body[name] =
            formData[name] ??
            node.attributes.value ??
            "";
        }
      }
    });

    // 2️⃣ Submit exactly to Ory
    if (!flow?.ui) return;
    const actionUrl = new URL(flow.ui.action);

    actionUrl.searchParams.set("flow", flow.id);

    const response = await ory.submitFlow(
      actionUrl.toString(),
      body,
      flow.ui.method
    );


    if (onSubmit) onSubmit(response);
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Submit failed");
    setErrors({ _form: error.message });
    if (onError) onError(error);
  } finally {
    setLoading(false);
  }
};


  const isSubmitting = loading || externalLoading;

  // Render messages (errors, info, success)
  const renderMessages = () => {
    const messages: OryMessage[] = [];
    
    // Add form-level errors
    if (errors._form) {
      messages.push({ id: 0, text: errors._form, type: 'error' });
    }
    
    // Add flow messages
    if (flow.ui?.messages) {
      messages.push(...flow.ui.messages);
    }

    if (messages.length === 0) return null;

    return (
      <div className="space-y-2 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg text-sm ${
              msg.type === 'error'
                ? 'bg-red-100 border border-red-400 text-red-700'
                : msg.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-blue-100 border border-blue-400 text-blue-700'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
    );
  };

  // Render a single UI node
  const renderNode = (node: UINode, nodeIndex: number) => {
    const { attributes } = node;

    // Hidden inputs (CSRF tokens, flow IDs, etc.)
    if (node.type === 'input' && attributes.type === 'hidden') {
      return (
        <input
          key={attributes.name}
          type="hidden"
          name={attributes.name}
          value={attributes.value || ''}
        />
      );
    }

    const renderPasswordInput = (
      fieldName: string,
      labelText: string,
      value: string,
      required?: boolean,
      nodeMessages?: OryMessage[]
    ) => {
      return (
        <div key={fieldName} className="mb-5">
          <label htmlFor={fieldName} className="block text-sm font-medium margin-small mb-2">
            {labelText}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Input
            id={fieldName}
            type="password"
            name={fieldName}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            disabled={isSubmitting}
            required={required}
            className="w-full mx-auto"
          />
          {errors[fieldName] && (
            <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
          )}
          {nodeMessages && nodeMessages.length > 0 && (
            <div className="mt-1">
              {nodeMessages.map((msg, idx) => (
                <p key={idx} className={`text-sm ${msg.type === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                  {msg.text}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    };

    // Text inputs
    if (node.type === 'input' && (attributes.type === 'text' || attributes.type === 'email' || attributes.type === 'password' || attributes.type === 'tel' || attributes.type === 'number')) {
      const fieldName = attributes.name;
      const fieldValue = formData[fieldName] || attributes.value || '';
      const fieldError = errors[fieldName];
      const label = attributes.label?.text || node.meta?.label?.text || attributes.name;

      if (attributes.type === 'password') {
        return (
          <Fragment key={`${fieldName}-password-group`}>
            {renderPasswordInput(fieldName, label, fieldValue, attributes.required, node.messages)}
            {requirePasswordConfirmation &&
              fieldName === passwordFieldName &&
              renderPasswordInput(
                confirmPasswordFieldName,
                'Confirm Password',
                formData[confirmPasswordFieldName] || '',
                true
              )}
          </Fragment>
        );
      }

      return (
        <div key={attributes.name} className="mb-5">
          <label htmlFor={attributes.name} className="block text-sm font-medium margin-small mb-2">
            {label}
            {attributes.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Input
            id={attributes.name}
            type={
              attributes.type === 'email'
                ? 'email'
                : attributes.type === 'tel'
                  ? 'tel'
                  : attributes.type === 'number'
                    ? 'number'
                    : 'text'
            }
            name={attributes.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            disabled={isSubmitting || attributes.disabled}
            required={attributes.required}
            placeholder={attributes.title}
            autoComplete={attributes.autocomplete}
            pattern={attributes.pattern}
            className="w-full mx-auto margin-small"
          />
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError}</p>
          )}
          {node.messages && node.messages.length > 0 && (
            <div className="mt-1">
              {node.messages.map((msg, idx) => (
                <p key={idx} className={`text-sm ${msg.type === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                  {msg.text}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }

    // TOTP/OTP code input
    if (node.type === 'input' && (attributes.name === 'totp_code' || attributes.name === 'code')) {
      const fieldName = attributes.name;
      const fieldValue = formData[fieldName] || '';
      const fieldError = errors[fieldName];
      const label = attributes.label?.text || node.meta?.label?.text || 'Verification Code';
      const isRequired = Boolean(attributes.required) && !(isRecoveryFlow && hasPasswordNode);

      return (
        <div key={attributes.name} className="mb-5">
          <label htmlFor={attributes.name} className="block text-sm font-medium margin-small mb-2">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Input
            id={attributes.name}
            type="text"
            name={attributes.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            disabled={isSubmitting || attributes.disabled}
            required={isRequired}
            placeholder="Enter code"
            pattern={attributes.pattern}
            className="w-full margin-small"
            maxLength={6}
          />
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError}</p>
          )}
        </div>
      );
    }

    // Submit buttons
    if (node.type === 'input' && attributes.type === 'submit') {
      const chosenSubmitIndex =
        preferredSubmitIndex >= 0 ? preferredSubmitIndex : lastSubmitIndex;
      if (singleSubmit && nodeIndex !== chosenSubmitIndex) {
        return null;
      }
      const label = attributes.label?.text || node.meta?.label?.text || attributes.value || 'Submit';
      const buttonValue = attributes.value || '';
      const buttonName = attributes.name || '';
      
      return (
        <Button
          key={attributes.name || 'submit'}
          type="submit"
          name={buttonName}
          value={buttonValue}
          data-method={buttonValue}
          disabled={isSubmitting}
          className="w-full mx-auto no-shadow margin-small padding-small bg-[#1f6feb] hover:bg-[#1a56c4] text-white"
        >
          {isSubmitting ? 'Processing...' : label}
        </Button>
      );
    }

    // Links (e.g., "Forgot password?", "Sign up")
    if (node.type === 'a' && attributes.href) {
      return (
        <a
          key={attributes.id || attributes.href}
          href={attributes.href}
          className="text-blue-600 hover:underline text-sm"
        >
          {attributes.text || node.meta?.label?.text}
        </a>
      );
    }

    // Images (e.g., TOTP QR code)
    if (node.type === 'img' && attributes.src) {
      return (
        <div key={attributes.id || attributes.src} className="mb-4 flex flex-col items-center gap-2">
          <img
            src={attributes.src}
            alt={attributes.title || node.meta?.label?.text || 'Authenticator QR code'}
            className="max-w-full h-auto border border-gray-200 rounded"
          />
          {(node.meta?.label?.text || attributes.title) && (
            <p className="text-sm text-gray-600 text-center">
              {node.meta?.label?.text || attributes.title}
            </p>
          )}
        </div>
      );
    }

    // Text nodes (labels, info text)
    if (node.type === 'text') {
      return (
        <p key={attributes.id || 'text'} className="text-sm text-gray-600 mb-2">
          {node.meta?.label?.text || attributes.text}
        </p>
      );
    }

    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderMessages()}
      
      {/* Render hidden inputs first */}
      {nodesWithIndex
        .filter(({ node }) => node.type === 'input' && node.attributes.type === 'hidden')
        .map(({ node, index }) => renderNode(node, index))}

      {/* Render visible inputs grouped */}
      {Object.entries(groupedNodesWithIndex).map(([group, groupNodes]) => (
        <div key={group}>
          {groupNodes
            .filter(({ node }) => node.type !== 'input' || node.attributes.type !== 'hidden')
            .map(({ node, index }) => renderNode(node, index))}
        </div>
      ))}
    </form>
  );
}
