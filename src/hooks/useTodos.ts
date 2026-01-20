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

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<api.ApiError | null>(null);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTodos = await api.getTodos();
      setTodos(fetchedTodos);
    } catch (err) {
      const apiError = err as api.ApiError;
      setError(apiError);
      // Set empty array on network errors to show fallback state
      if (apiError.isNetworkError) {
        setTodos([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = useCallback(async (title: string) => {
    try {
      setError(null);
      const newTodo = await api.createTodo(title);
      setTodos((prev) => [...prev, newTodo]);
    } catch (err) {
      const apiError = err as api.ApiError;
      setError(apiError);
      throw apiError;
    }
  }, []);

  const updateTodo = useCallback(async (id: string | number, updates: Partial<Todo>) => {
    try {
      setError(null);
      const updatedTodo = await api.updateTodo(id, updates);
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updatedTodo : todo))
      );
    } catch (err) {
      const apiError = err as api.ApiError;
      setError(apiError);
      throw apiError;
    }
  }, []);

  const deleteTodo = useCallback(async (id: string | number) => {
    try {
      setError(null);
      await api.deleteTodo(id);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      const apiError = err as api.ApiError;
      setError(apiError);
      throw apiError;
    }
  }, []);

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
