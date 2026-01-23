import type { Todo } from '../types/todo';

const API_BASE_URL = 'http://localhost:8787';

export interface ApiError {
  message: string;
  status?: number;
  isNetworkError: boolean;
}

/**
 * Checks if an error is a network error (server unavailable)
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  if (error instanceof Error) {
    return error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('Network request failed');
  }
  return false;
}

/**
 * Creates a standardized API error object
 */
function createApiError(error: unknown, status?: number): ApiError {
  const isNetwork = isNetworkError(error);
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    status,
    isNetworkError: isNetwork,
  };
}

function getMessageFromBody(
  body: { message?: string; error?: string; detail?: string; reason?: string },
  fallback: string,
  status?: number
): string {
  const msg = body?.message || body?.error || body?.detail || body?.reason;
  if (msg) return msg;
  if (status === 500) return 'Server error (500). Check backend logs (Supabase, Keto, worker).';
  return fallback;
}

type ApiOptions = RequestInit & { userId?: string | null };

/**
 * Generic API helper: cookie support, JSON headers, X-User-Id when userId is provided.
 */
async function api(endpoint: string, options: ApiOptions = {}): Promise<Response> {
  const { userId, ...fetchInit } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchInit.headers as Record<string, string>),
  };
  if (userId) {
    (headers as Record<string, string>)['X-User-Id'] = userId;
  }

  return fetch(url, {
    ...fetchInit,
    headers,
    credentials: 'include',
  });
}

/**
 * Fetches all todos from the API. Sends X-User-Id when userId is provided.
 */
export async function getTodos(userId: string | null): Promise<Todo[]> {
  try {
    const response = await api('/api/todos', { userId });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw createApiError(new Error(getMessageFromBody(body, response.statusText, response.status)), response.status);
    }
    return response.json();
  } catch (error) {
    if ((error as ApiError).status !== undefined) throw error;
    throw createApiError(error);
  }
}

/**
 * Creates a new todo. Sends X-User-Id when userId is provided.
 */
export async function createTodo(title: string, userId: string | null): Promise<Todo> {
  try {
    const response = await api('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
      userId,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw createApiError(new Error(getMessageFromBody(body, response.statusText, response.status)), response.status);
    }
    return response.json();
  } catch (error) {
    if ((error as ApiError).status !== undefined) throw error;
    throw createApiError(error);
  }
}

/**
 * Updates an existing todo. Sends X-User-Id when userId is provided.
 */
export async function updateTodo(id: string | number, updates: Partial<Todo>, userId: string | null): Promise<Todo> {
  try {
    const response = await api(`/api/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      userId,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw createApiError(new Error(getMessageFromBody(body, response.statusText, response.status)), response.status);
    }
    return response.json();
  } catch (error) {
    if ((error as ApiError).status !== undefined) throw error;
    throw createApiError(error);
  }
}

/**
 * Deletes a todo. Sends X-User-Id when userId is provided.
 */
export async function deleteTodo(id: string | number, userId: string | null): Promise<void> {
  try {
    const response = await api(`/api/todos/${id}`, { method: 'DELETE', userId });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw createApiError(new Error(getMessageFromBody(body, response.statusText, response.status)), response.status);
    }
  } catch (error) {
    if ((error as ApiError).status !== undefined) throw error;
    throw createApiError(error);
  }
}

/**
 * Logs in a user (mocked for now, ready for Ory integration)
 */
export async function login(email: string, password: string): Promise<void> {
  try {
    const response = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed: ${response.status} ${response.statusText}`);
    }
    
    // For now, just return - the response will set cookies
    // Later: parse Ory session from response
  } catch (error) {
    throw createApiError(error);
  }
}

/**
 * Registers a new user (mocked for now, ready for Ory integration)
 */
export async function register(email: string, password: string): Promise<void> {
  try {
    const response = await api('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Registration failed: ${response.status} ${response.statusText}`);
    }
    
    // For now, just return - the response will set cookies
    // Later: parse Ory session from response
  } catch (error) {
    throw createApiError(error);
  }
}
