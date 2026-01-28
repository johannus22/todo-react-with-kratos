import { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import type { Todo } from '../types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string | number) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(todo.id);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(todo.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="mb-3 no-shadow">
      <div className="flex items-center gap-3 p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={handleToggle}
            disabled={isToggling || isDeleting}
            className="w-5 h-5 cursor-pointer accent-[#1f6feb]"
          />
          <span
            className={`flex-1 truncate text-sm sm:text-base ${
              todo.completed
                ? 'line-through text-gray-500'
                : 'text-gray-900'
            }`}
          >
            {todo.title}
          </span>
        </div>
        <Button
          onClick={handleDelete}
          disabled={isToggling || isDeleting}
          className="shrink-0 no-shadow bg-[#aC0101] hover:bg-[#b91c1c] text-white"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Card>
  );
}
