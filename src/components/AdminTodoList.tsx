import { Button, Card } from 'pixel-retroui';
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
      <div className="text-center py-6">
        <p className="text-lg">Loading all todos...</p>
      </div>
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
    return (
      <Card className="p-4" bg={is401 || is403 ? 'red' : 'yellow'} textColor={is401 || is403 ? 'white' : 'black'}>
        <div className="space-y-2">
          <h3 className="font-bold text-lg">{title}</h3>
          <p>{error.message}</p>
        </div>
      </Card>
    );
  }

  if (todos.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-lg text-gray-600">No todos found across accounts.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <Card key={todo.id} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              bg="red"
              textColor="white"
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
