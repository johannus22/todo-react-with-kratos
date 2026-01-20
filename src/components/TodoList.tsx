import { TodoItem } from './TodoItem';
import { Card } from 'pixel-retroui';
import type { Todo } from '../types/todo';
import type { ApiError } from '../services/api';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  error: ApiError | null;
  onToggle: (id: string | number) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
}

export function TodoList({ todos, loading, error, onToggle, onDelete }: TodoListProps) {
  const isNetworkError = error?.isNetworkError ?? false;

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">Loading todos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 mb-4" bg="yellow" textColor="black">
        <div className="space-y-2">
          <h3 className="font-bold text-lg">⚠️ Connection Error</h3>
          <p>
            {isNetworkError
              ? 'Unable to connect to the server. Please make sure the backend is running on http://localhost:8080'
              : `Error: ${error.message}`}
          </p>
          {isNetworkError && (
            <p className="text-sm mt-2">
              The app is running in fallback mode. Todos will not be saved until
              the server is available.
            </p>
          )}
        </div>
      </Card>
    );
  }

  if (todos.length === 0) {
    const emptyMessage = isNetworkError
      ? 'No todos available. Server is offline.'
      : 'No todos yet. Add one above!';
    
    return (
      <Card className="p-8 text-center">
        <p className="text-lg text-gray-600">
          {emptyMessage}
        </p>
      </Card>
    );
  }

  return (
    <div>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
