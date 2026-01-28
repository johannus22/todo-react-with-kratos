import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`neo-input w-full bg-white text-black placeholder:text-gray-500 disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
