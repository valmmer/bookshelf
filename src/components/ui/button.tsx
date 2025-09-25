// src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button com tokens Light/Dark e foco acessível.
 * - Variantes: default, destructive, outline, secondary, ghost, link
 * - Tamanhos: default, sm, lg, icon
 * - Acessibilidade: focus-visible ring + offset
 * - Disabled: cursor-not-allowed + opacity
 * - Suporte opcional a loading (isLoading)
 */

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-md text-sm font-medium',
    'transition-colors select-none',
    'h-9 px-4',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        outline:
          'border border-input bg-transparent text-foreground hover:bg-muted',

        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        ghost: 'bg-transparent hover:bg-muted',
        link: 'bg-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-10 rounded-md px-6',
        icon: 'h-9 w-9 p-0',
      },
      loading: {
        true: 'relative',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Quando true, mostra um spinner e faz aria-busy (apenas quando NÃO é asChild) */
  isLoading?: boolean;
  /** Oculta o conteúdo enquanto carrega (true) ou mantém (false) */
  hideChildrenOnLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      isLoading = false,
      hideChildrenOnLoading = false,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Quando asChild=true, NUNCA injete spinner ou wrappers.
    // O Slot exige exatamente UM filho.
    if (asChild) {
      return (
        <Comp
          ref={ref as any}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {children /* ex.: <Link>...</Link> (um único elemento) */}
        </Comp>
      );
    }

    // Caminho padrão (button nativo) com spinner/aria-busy
    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({
            variant,
            size,
            loading: isLoading ? true : loading,
            className,
          })
        )}
        aria-busy={isLoading || undefined}
        aria-live="polite"
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 inline-block h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}

        <span
          className={
            isLoading && hideChildrenOnLoading ? 'opacity-0' : 'opacity-100'
          }
        >
          {children}
        </span>
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
