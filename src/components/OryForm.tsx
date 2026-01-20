import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Button, Input } from 'pixel-retroui';
import type { OryFlow, UINode, OryMessage } from '../services/ory';
import * as ory from '../services/ory';

interface OryFormProps {
  flow: OryFlow;
  onSubmit?: (flow: OryFlow) => void;
  onError?: (error: Error) => void;
  loading?: boolean;
}

export function OryForm({ flow, onSubmit, onError, loading: externalLoading }: OryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nodes = useMemo(() => flow?.ui?.nodes ?? [], [flow]);


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

    // Text inputs
    if (node.type === 'input' && (attributes.type === 'text' || attributes.type === 'email' || attributes.type === 'password' || attributes.type === 'tel' || attributes.type === 'number')) {
      const fieldName = attributes.name;
      const fieldValue = formData[fieldName] || attributes.value || '';
      const fieldError = errors[fieldName];
      const label = attributes.label?.text || node.meta?.label?.text || attributes.name;

      return (
        <div key={attributes.name} className="mb-4">
          <label htmlFor={attributes.name} className="block text-sm font-medium mb-1">
            {label}
            {attributes.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Input
            id={attributes.name}
            type={attributes.type === 'password' ? 'password' : attributes.type === 'email' ? 'email' : 'text'}
            name={attributes.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            disabled={isSubmitting || attributes.disabled}
            required={attributes.required}
            placeholder={attributes.title}
            autoComplete={attributes.autocomplete}
            pattern={attributes.pattern}
            className="w-full"
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
          className="w-full"
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
