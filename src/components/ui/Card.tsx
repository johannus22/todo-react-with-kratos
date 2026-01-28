import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', ...props }: CardProps) {
  return <div className={`page-card no-shadow padding-have ${className}`} {...props} />;
}
