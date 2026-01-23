import { useState } from 'react';
import { Button, Card } from 'pixel-retroui';
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
    <Card className="mb-3">
      <div className="flex items-center gap-4 p-4">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggle}
          disabled={isToggling || isDeleting}
          className="w-5 h-5 cursor-pointer"
        />
        <span
          className={`flex-1 truncate ${
            todo.completed
              ? 'line-through text-gray-500'
              : 'text-gray-900'
          }`}
        >
          {todo.title}
        </span>
        <Button
          onClick={handleDelete}
          disabled={isToggling || isDeleting}
          bg="red"
          textColor="white"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Card>
  );
}
