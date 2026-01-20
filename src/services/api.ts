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

/**
 * Generic API helper that wraps fetch with cookie support and JSON headers
 */
async function api(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
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

/**
 * Fetches all todos from the API
 */
export async function getTodos(): Promise<Todo[]> {
  try {
    const response = await api('/api/todos');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch todos: ${response.status} ${response.statusText}`);
    }
    
    const todos = await response.json();
    return todos;
  } catch (error) {
    throw createApiError(error);
  }
}

/**
 * Creates a new todo
 */
export async function createTodo(title: string): Promise<Todo> {
  try {
    const response = await api('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create todo: ${response.status} ${response.statusText}`);
    }
    
    const todo = await response.json();
    return todo;
  } catch (error) {
    throw createApiError(error);
  }
}

/**
 * Updates an existing todo
 */
export async function updateTodo(id: string | number, updates: Partial<Todo>): Promise<Todo> {
  try {
    const response = await api(`/api/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update todo: ${response.status} ${response.statusText}`);
    }
    
    const todo = await response.json();
    return todo;
  } catch (error) {
    throw createApiError(error);
  }
}

/**
 * Deletes a todo
 */
export async function deleteTodo(id: string | number): Promise<void> {
  try {
    const response = await api(`/api/todos/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete todo: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
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
