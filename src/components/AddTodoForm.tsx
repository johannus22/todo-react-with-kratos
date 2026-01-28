import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3 p-5 mb-6 no-shadow">
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task you want to finish"
        disabled={disabled || isSubmitting}
        className="flex-1 min-w-[220px] no-shadow"
      />
      <Button
        type="submit"
        disabled={disabled || isSubmitting || !title.trim()}
        className="flex-1 min-w-[220px] bg-[#1f6feb] hover:bg-[#1a56c4] text-white no-shadow"
      >
        {isSubmitting ? 'Adding...' : 'Add Task'}
      </Button>
    </form>
  );
}
