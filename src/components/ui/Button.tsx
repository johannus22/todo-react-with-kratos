import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`neo-button px-5 py-2.5 font-medium bg-[#ffe77a] text-black hover:bg-[#ffd94f] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
