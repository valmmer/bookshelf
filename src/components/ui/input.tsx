import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // base
          'flex h-9 w-full rounded-md px-3 py-1 text-sm shadow-sm transition-colors',
          // tokens (Light/Dark)
          'border border-input bg-card text-foreground',
          'placeholder:text-muted-foreground',
          // file input compat
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          // acessibilidade
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
          // estados
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/40',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
