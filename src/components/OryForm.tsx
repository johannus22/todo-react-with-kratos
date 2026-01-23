import { useState, useEffect, useMemo, Fragment } from 'react';
import type { FormEvent } from 'react';
import { Button, Input } from 'pixel-retroui';
import type { OryFlow, UINode, OryMessage } from '../services/ory';
import * as ory from '../services/ory';

interface OryFormProps {
  flow: OryFlow;
  onSubmit?: (flow: OryFlow) => void;
  onError?: (error: Error) => void;
  loading?: boolean;
  showPasswordToggles?: boolean;
  requirePasswordConfirmation?: boolean;
  requirePasswordStrength?: boolean;
}

export function OryForm({
  flow,
  onSubmit,
  onError,
  loading: externalLoading,
  showPasswordToggles = false,
  requirePasswordConfirmation = false,
  requirePasswordStrength = false,
}: OryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});
  const nodes = useMemo(() => flow?.ui?.nodes ?? [], [flow]);
  const passwordFieldName = useMemo(() => {
    const passwordNode = nodes.find(
      (node) => node.type === 'input' && node.attributes.type === 'password'
    );
    return passwordNode?.attributes.name ?? '';
  }, [nodes]);
  const confirmPasswordFieldName = 'confirm_password';

  const isStrongPassword = (value: string) =>
    /[A-Za-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);


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

    if (requirePasswordStrength && name === passwordFieldName) {
      if (!value) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
        return;
      }

      if (!isStrongPassword(value)) {
        setErrors((prev) => ({
          ...prev,
          [name]: 'Password must include a letter, number, and symbol.',
        }));
      }
    }
  };

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  setErrors({});

  try {
    if (requirePasswordStrength && passwordFieldName) {
      const passwordValue = formData[passwordFieldName] || '';

      if (passwordValue && !isStrongPassword(passwordValue)) {
        setErrors({ [passwordFieldName]: 'Password must include a letter, number, and symbol.' });
        setLoading(false);
        return;
      }
    }

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
            className={`p-3 rounded ${
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
  const renderNode = (node: UINode) => {
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
      const isVisible = passwordVisibility[fieldName] || false;

      return (
        <div key={fieldName} className="mb-4">
          <label htmlFor={fieldName} className="block text-sm font-medium mb-1">
            {labelText}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <Input
              id={fieldName}
              type={isVisible ? 'text' : 'password'}
              name={fieldName}
              value={value}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              disabled={isSubmitting}
              required={required}
              className={`w-full mx-auto${showPasswordToggles ? ' pr-10' : ''}`}
            />
            {showPasswordToggles && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                aria-label={isVisible ? 'Hide password' : 'Show password'}
                onClick={() =>
                  setPasswordVisibility((prev) => ({ ...prev, [fieldName]: !isVisible }))
                }
              >
                {isVisible ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M12 4.5c-5 0-9.27 3.11-11 7.5 1.09 2.67 3.09 4.83 5.5 6.12l-1.5 1.5 1.41 1.41 16.97-16.97-1.41-1.41-2.28 2.28A11.75 11.75 0 0 0 12 4.5Zm-5.4 11.28A9.42 9.42 0 0 1 3.13 12c1.4-3.12 4.7-5.25 8.87-5.25 1.33 0 2.59.22 3.75.62l-2.07 2.07a4 4 0 0 0-5.07 5.07l-2.01 2.2Zm5.4 2.97c-.86 0-1.67-.14-2.44-.39l1.75-1.75a2.5 2.5 0 0 0 3.44-3.44l1.75-1.75c.25.77.39 1.58.39 2.44 0 2.49-2.02 4.5-4.5 4.5Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M12 5c-5 0-9.27 3.11-11 7.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                  </svg>
                )}
              </button>
            )}
          </div>
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
            {requirePasswordStrength && fieldName === passwordFieldName && (
              <p className="mt-1 text-xs text-gray-600">
                Must include at least one letter, one number, and one symbol.
              </p>
            )}
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
        <div key={attributes.name} className="mb-4">
          <label htmlFor={attributes.name} className="block text-sm font-medium mb-1">
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
            className="w-full mx-auto"
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

      return (
        <div key={attributes.name} className="mb-4">
          <label htmlFor={attributes.name} className="block text-sm font-medium mb-1">
            {label}
            {attributes.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Input
            id={attributes.name}
            type="text"
            name={attributes.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            disabled={isSubmitting || attributes.disabled}
            required={attributes.required}
            placeholder="Enter code"
            pattern={attributes.pattern}
            className="w-full"
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
          className="w-full mx-auto"
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

  // Group nodes by their group attribute
  const groupedNodes = nodes.reduce((acc, node) => {
    const group = node.group || 'default';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(node);
    return acc;
  }, {} as Record<string, UINode[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderMessages()}
      
      {/* Render hidden inputs first */}
      {nodes
        .filter((node) => node.type === 'input' && node.attributes.type === 'hidden')
        .map((node) => renderNode(node))}

      {/* Render visible inputs grouped */}
      {Object.entries(groupedNodes).map(([group, nodes]) => (
        <div key={group}>
          {nodes
            .filter((node) => node.type !== 'input' || node.attributes.type !== 'hidden')
            .map((node) => {
              const rendered = renderNode(node);
              return rendered;
            })}
        </div>
      ))}
    </form>
  );
}
