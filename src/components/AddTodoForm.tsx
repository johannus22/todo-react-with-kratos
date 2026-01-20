import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Input } from 'pixel-retroui';

interface AddTodoFormProps {
  onSubmit: (title: string) => Promise<void>;
  disabled?: boolean;
}

export function AddTodoForm({ onSubmit, disabled }: AddTodoFormProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
      setTitle('');
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a new todo..."
        disabled={disabled || isSubmitting}
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={disabled || isSubmitting || !title.trim()}
      >
        {isSubmitting ? 'Adding...' : 'Add Todo'}
      </Button>
    </form>
  );
}
