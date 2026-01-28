import { TodoItem } from './TodoItem';
import { Card } from './ui/Card';
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
      <Card className="p-8 text-center">
        <p className="text-lg text-gray-700">Loading your list...</p>
      </Card>
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
    const errorClasses = is401 || is403
      ? 'bg-[#b42318] text-white'
      : 'bg-[#ffe77a] text-black';
    return (
      <Card className={`p-6 mb-4 ${errorClasses}`}>
        <div className="space-y-2">
          <h3 className="font-bold text-lg">{title}</h3>
          <p>{message}</p>
          {isNetworkError && !is401 && !is403 && (
            <p className="text-sm mt-10">
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
      <Card className="p-10 text-center border-dashed">
        <p className="text-lg text-gray-600">{emptyMessage}</p>
        <p className="text-sm text-gray-500 mt-2">
          Capture a small, clear task and build momentum.
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
