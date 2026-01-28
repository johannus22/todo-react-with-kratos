import { Button } from './ui/Button';
import { Card } from './ui/Card';
import type { Todo } from '../types/todo';
import type { ApiError } from '../services/api';

interface AdminTodoListProps {
  todos: Todo[];
  loading: boolean;
  error: ApiError | null;
  onDelete: (id: string | number) => Promise<void>;
}

function getOwnerLabel(todo: Todo): string {
  return (
    todo.userEmail ||
    todo.user_email ||
    todo.ownerEmail ||
    todo.owner_email ||
    todo.userId ||
    todo.user_id ||
    todo.ownerId ||
    todo.owner_id ||
    'Unknown owner'
  );
}

function getCreatedAt(todo: Todo): string | null {
  const value = todo.createdAt || todo.created_at;
  return value ? new Date(value).toLocaleString() : null;
}

export function AdminTodoList({ todos, loading, error, onDelete }: AdminTodoListProps) {
  if (loading) {
    return (
      <Card className="p-7 text-center">
        <p className="text-lg text-gray-700">Loading all todos...</p>
      </Card>
    );
  }

  if (error) {
    const is401 = error.status === 401;
    const is403 = error.status === 403;
    const title = is401
      ? 'Please sign in'
      : is403
        ? 'Admin access required'
        : 'Error';
    const errorClasses = is401 || is403
      ? 'bg-[#b42318] text-white'
      : 'bg-[#ffe77a] text-black';
    return (
      <Card className={`p-4 ${errorClasses}`}>
        <div className="space-y-2">
          <h3 className="font-bold text-lg">{title}</h3>
          <p>{error.message}</p>
        </div>
      </Card>
    );
  }

  if (todos.length === 0) {
    return (
      <Card className="p-7 text-center">
        <p className="text-lg text-gray-600">No todos found across accounts.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <Card key={todo.id} className="p-5 no-shadow">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`truncate ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {todo.title}
                </span>
                {todo.completed && (
                  <span className="text-xs uppercase tracking-wide text-gray-500">Completed</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Owner: {getOwnerLabel(todo)}
                {getCreatedAt(todo) ? ` • Created ${getCreatedAt(todo)}` : ''}
              </div>
            </div>
            <Button
              onClick={() => onDelete(todo.id)}
              className="shrink-0 bg-[#dc2626] hover:bg-[#b91c1c] text-white"
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
