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
    const is401 = error.status === 401;
    const is403 = error.status === 403;
    const title = is401
      ? 'Please sign in'
      : is403
        ? 'Permission denied'
        : isNetworkError
          ? '⚠️ Connection Error'
          : 'Error';
    const message = is401
      ? 'Please sign in.'
      : is403
        ? "You can't edit or delete this."
        : isNetworkError
          ? 'Unable to connect to the server. Please make sure the backend is running on http://localhost:8787'
          : error.message;
    return (
      <Card className="p-6 mb-4" bg={is401 || is403 ? 'red' : 'yellow'} textColor={is401 || is403 ? 'white' : 'black'}>
        <div className="space-y-2">
          <h3 className="font-bold text-lg">{title}</h3>
          <p>{message}</p>
          {isNetworkError && !is401 && !is403 && (
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
      <Card className="p-8 text-center  ">
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
