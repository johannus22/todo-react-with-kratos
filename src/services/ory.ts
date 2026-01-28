/**
 * Ory Kratos Service
 * Handles all interactions with Ory Kratos self-service flows
 */

export interface OryFlow {
  id: string;
  type: 'login' | 'registration' | 'settings' | 'logout' | 'recovery' | 'verification';
  expires_at: string;
  issued_at: string;
  request_url: string;
  ui: {
    action: string;
    method: string;
    nodes: UINode[];
    messages?: OryMessage[];
  };
  state?: string;
}

export interface UINode {
  type: string;
  group: string;
  attributes: {
    name: string;
    type?: string;
    value?: string;
    required?: boolean;
    disabled?: boolean;
    node_type?: string;
    autocomplete?: string;
    pattern?: string;
    title?: string;
    onclick?: string;
    text?: string;
    href?: string;
    src?: string;
    id?: string;
    label?: {
      text: string;
      context?: any;
    };
  };
  messages?: OryMessage[];
  meta?: {
    label?: {
      text: string;
    };
  };
}

export interface OryMessage {
  id: number;
  text: string;
  type: 'error' | 'info' | 'success';
  context?: any;
}

export interface OryIdentity {
  id: string;
  schema_id: string;
  schema_url: string;
  state: string;
  state_changed_at?: string;
  traits: {
    email?: string;
    [key: string]: any;
  };
  verifiable_addresses?: Array<{
    value: string;
    verified: boolean;
    via: string;
    status: string;
    id: string;
    verified_at?: string;
    created_at: string;
    updated_at: string;
  }>;
  recovery_addresses?: Array<{
    value: string;
    via: string;
    id: string;
    created_at: string;
    updated_at: string;
  }>;
  metadata_public?: any;
  metadata_admin?: any;
  created_at: string;
  updated_at: string;
}

export interface OrySession {
  id: string;
  active: boolean;
  expires_at?: string;
  authenticated_at?: string;
  issued_at?: string;
  identity: OryIdentity;
  devices?: any[];
}

export interface WhoAmIResponse {
  session?: OrySession;
  error?: {
    code: number;
    status: string;
    message: string;
    reason?: string;
    details?: {
      redirect_browser_to?: string;
    };
  };
  redirect_browser_to?: string;
}

/**
 * Get Ory base URL from environment variable
 */
export function getOryUrl(): string {
  const url = import.meta.env.VITE_ORY_URL;
  if (!url) {
    throw new Error('VITE_ORY_URL environment variable is not set');
  }
  return url.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Normalize URL to replace Docker container hostnames with localhost
 */
export function normalizeUrl(url: string): string {
  const baseUrl = getOryUrl();
  try {
    const urlObj = new URL(url);
    // If the hostname is not localhost/127.0.0.1 and matches the base URL port, replace it
    if (urlObj.hostname !== 'localhost' && urlObj.hostname !== '127.0.0.1' && urlObj.port === new URL(baseUrl).port) {
      urlObj.hostname = 'localhost';
      return urlObj.toString();
    }
  } catch {
    // If URL parsing fails, return as-is
  }
  return url;
}

/**
 * Generic fetch helper for Ory API calls
 */
async function oryFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getOryUrl();
  // Normalize URLs that might contain Docker hostnames
  const normalizedEndpoint = endpoint.startsWith('http') ? normalizeUrl(endpoint) : endpoint;
  const url = normalizedEndpoint.startsWith('http') ? normalizedEndpoint : `${baseUrl}${normalizedEndpoint}`;

  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  return response;
}

function collectOryMessages(data: any): OryMessage[] {
  const messages: OryMessage[] = [];

  if (Array.isArray(data?.ui?.messages)) {
    messages.push(...data.ui.messages);
  }

  if (Array.isArray(data?.ui?.nodes)) {
    for (const node of data.ui.nodes) {
      if (Array.isArray(node?.messages)) {
        messages.push(...node.messages);
      }
    }
  }

  return messages;
}

function getOryErrorMessage(data: any, fallback = 'Ory error'): string {
  const messages = collectOryMessages(data);
  const errorMessage = messages.find((msg) => msg.type === 'error')?.text;
  if (errorMessage) return errorMessage;

  return (
    data?.error?.message ||
    data?.error?.reason ||
    data?.message ||
    fallback
  );
}

/**
 * Fetch a flow from Ory Kratos
 * @param flowType - Type of flow: 'login', 'registration', 'settings', 'logout'
 * @param flowId - Optional flow ID if continuing an existing flow
 * @param returnTo - Optional return URL after flow completion
 */
export async function fetchFlow(
  flowType: 'login' | 'registration' | 'settings' | 'logout' | 'recovery',
  flowId?: string,
  returnTo?: string,
  refresh?: boolean
): Promise<OryFlow> {
  let endpoint = '';

  if (flowId && flowType !== 'logout') {
    endpoint = `/self-service/${flowType}/flows?id=${flowId}`;
  } else {
    switch (flowType) {
      case 'login':
        endpoint = '/self-service/login/browser';
        break;
      case 'registration':
        endpoint = '/self-service/registration/browser';
        break;
      case 'settings':
        endpoint = '/self-service/settings/browser';
        break;
      case 'recovery':
        endpoint = '/self-service/recovery/browser';
        break;
      case 'logout':
        endpoint = '/self-service/logout/browser';
        break;
    }

    const params = new URLSearchParams();
    if (returnTo) {
      params.set('return_to', returnTo);
    }
    if (flowType === 'login' && refresh) {
      params.set('refresh', 'true');
    }
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
  }

  const response = await oryFetch(endpoint);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: `Failed to fetch ${flowType} flow: ${response.statusText}` }
    }));
    throw new Error(error.error?.message || `Failed to fetch ${flowType} flow`);
  }

  const flow = await response.json();
  // Normalize action URL in the flow response
  if (flow.ui?.action) {
    flow.ui.action = normalizeUrl(flow.ui.action);
  }
  // Normalize request_url as well
  if (flow.request_url) {
    flow.request_url = normalizeUrl(flow.request_url);
  }
  return flow;
}

/**
 * Submit a flow form to Ory Kratos
 * @param action - The action URL from the flow
 * @param body - Form data to submit
 * @param method - HTTP method (usually 'POST')
 */
export async function submitFlow(action: string, body: any, method: string) {
  const res = await fetch(action, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    if (
      data?.error?.id === 'browser_location_change_required' &&
      data?.redirect_browser_to
    ) {
      const redirectUrl = normalizeUrl(data.redirect_browser_to);
      window.location.href = redirectUrl;
      return data;
    }

    if (data?.ui?.action) {
      data.ui.action = normalizeUrl(data.ui.action);
    }

    if (data?.request_url) {
      data.request_url = normalizeUrl(data.request_url);
    }

    if (data?.ui?.nodes || data?.ui?.messages) {
      return data;
    }

    throw new Error(getOryErrorMessage(data));
  }

  return data;
}



/**
 * Check current session via /sessions/whoami
 */
export async function whoami(): Promise<WhoAmIResponse> {
  const response = await oryFetch('/sessions/whoami');

  if (response.status === 401) {
    return { error: { code: 401, status: 'Unauthorized', message: 'Not authenticated' } };
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: `Session check failed: ${response.statusText}` }
    }));
    return {
      error: {
        code: response.status,
        status: response.statusText,
        message: error.error?.message || 'Session check failed',
        reason: error.error?.reason,
        details: error.error?.details,
      },
      redirect_browser_to: error.redirect_browser_to || error.error?.details?.redirect_browser_to,
    };
  }

  const session = await response.json();
  return { session };
}

/**
 * Perform logout by redirecting to logout flow
 */
export async function logout(returnTo?: string): Promise<void> {
  try {
    const baseUrl = getOryUrl();
    let logoutUrl = `${baseUrl}/self-service/logout/browser`;
    
    // Add return_to parameter if provided
    if (returnTo) {
      logoutUrl += `?return_to=${encodeURIComponent(returnTo)}`;
    }
    
    // Call the logout API endpoint which returns JSON with logout_url
    const response = await oryFetch(logoutUrl, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      // Ory returns JSON with logout_url and logout_token
      if (data.logout_url) {
        // Normalize the logout URL (replace Docker hostnames with localhost)
        const normalizedLogoutUrl = normalizeUrl(data.logout_url);
        window.location.href = normalizedLogoutUrl;
        return;
      }
    }

    // If response is not OK or no logout_url, try to parse error
    if (!response.ok) {
      await response.json().catch(() => ({}));
    }

    // Fallback: construct logout URL manually and redirect
    let fallbackUrl = `${baseUrl}/self-service/logout/browser`;
    if (returnTo) {
      fallbackUrl += `?return_to=${encodeURIComponent(returnTo)}`;
    }
    window.location.href = fallbackUrl;
  } catch (error) {
    // Fallback: construct logout URL manually
    const baseUrl = getOryUrl();
    let url = `${baseUrl}/self-service/logout/browser`;
    if (returnTo) {
      url += `?return_to=${encodeURIComponent(returnTo)}`;
    }
    window.location.href = url;
  }
}
