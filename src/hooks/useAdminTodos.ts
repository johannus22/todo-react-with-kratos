import { useCallback, useEffect, useState } from 'react';
import type { Todo } from '../types/todo';
import type { ApiError } from '../services/api';
import * as api from '../services/api';

interface UseAdminTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: ApiError | null;
  deleteTodo: (id: string | number) => Promise<void>;
  refetch: () => Promise<void>;
}

function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

export function useAdminTodos(userId: string | null): UseAdminTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

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
      const fetchedTodos = await api.getAllTodos(userId);
      setTodos(fetchedTodos);
    } catch (err) {
      const apiError = isApiError(err) ? err : (err as ApiError);
      if (apiError.status === 401) {
        window.location.href = '/login';
        return;
      }
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const deleteTodo = useCallback(async (id: string | number) => {
    if (!userId) return;
    try {
      setError(null);
      await api.deleteTodoAsAdmin(id, userId);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      const apiError = isApiError(err) ? err : (err as ApiError);
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
    deleteTodo,
    refetch: fetchTodos,
  };
}
