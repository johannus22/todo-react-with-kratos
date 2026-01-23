import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '../types/todo';
import * as api from '../services/api';

interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: api.ApiError | null;
  addTodo: (title: string) => Promise<void>;
  updateTodo: (id: string | number, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string | number) => Promise<void>;
  refetch: () => Promise<void>;
}

function isApiError(err: unknown): err is api.ApiError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

export function useTodos(userId: string | null): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<api.ApiError | null>(null);

  const fetchTodos = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setTodos([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedTodos = await api.getTodos(userId);
      setTodos(fetchedTodos);
    } catch (err) {
      const apiError = isApiError(err) ? err : (err as api.ApiError);
      if (apiError.status === 401) {
        window.location.href = '/login';
        return;
      }
      setError(apiError);
      if (apiError.isNetworkError) setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = useCallback(async (title: string) => {
    if (!userId) return;
    try {
      setError(null);
      const newTodo = await api.createTodo(title, userId);
      setTodos((prev) => [...prev, newTodo]);
    } catch (err) {
      const apiError = isApiError(err) ? err : (err as api.ApiError);
      if (apiError.status === 401) {
        window.location.href = '/login';
        return;
      }
      setError(apiError);
      throw apiError;
    }
  }, [userId]);

  const updateTodo = useCallback(async (id: string | number, updates: Partial<Todo>) => {
    if (!userId) return;
    try {
      setError(null);
      const updatedTodo = await api.updateTodo(id, updates, userId);
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updatedTodo : todo))
      );
    } catch (err) {
      const apiError = isApiError(err) ? err : (err as api.ApiError);
      if (apiError.status === 401) {
        window.location.href = '/login';
        return;
      }
      setError(apiError);
      throw apiError;
    }
  }, [userId]);

  const deleteTodo = useCallback(async (id: string | number) => {
    if (!userId) return;
    try {
      setError(null);
      await api.deleteTodo(id, userId);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      const apiError = isApiError(err) ? err : (err as api.ApiError);
      if (apiError.status === 401) {
        window.location.href = '/login';
        return;
      }
      setError(apiError);
      throw apiError;
    }
  }, [userId]);

  return {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    refetch: fetchTodos,
  };
}
