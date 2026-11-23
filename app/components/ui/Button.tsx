import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

/**
 * Definición de variantes para el componente Button
 */
const buttonVariants = cva(
  // Base. Colours come from the semantic tokens in app/globals.css; every
  // filled variant is ≥ 4.5:1 with white text (WCAG 2.1 AA) in both themes.
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Acción principal (verde de marca, tono AA)
        primary: "bg-primary text-on-primary shadow-sm hover:bg-primary-hover",
        // Acción alternativa (naranja de marca, tono AA)
        secondary: "bg-secondary text-on-primary shadow-sm hover:bg-secondary-hover",
        // Acción destructiva
        danger: "bg-danger text-on-primary shadow-sm hover:bg-danger-hover",
        // Acción terciaria sin fondo
        ghost: "bg-transparent text-fg hover:bg-surface-muted",
        // Con borde (azul de marca)
        outline: "border-2 border-accent bg-transparent text-accent hover:bg-accent/10",
      },
      // Touch screens get ≥ 44px targets (WCAG 2.5.5 / Apple HIG)
      size: {
        sm: "h-9 px-3 text-sm pointer-coarse:h-11",
        md: "h-10 px-4 text-base pointer-coarse:h-11",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Componente Button reutilizable
 *
 * @example
 * <Button variant="primary" size="md" onClick={() => {}}>
 *   Guardar
 * </Button>
 *
 * @example
 * <Button variant="danger" leftIcon={<TrashIcon />}>
 *   Eliminar
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <Spinner color="white" size="sm" className="mr-2" />
        )}
        {!isLoading && leftIcon && (
          <span className="inline-flex items-center">{leftIcon}</span>
        )}
        {/* inline-flex: an icon passed as a child (Tailwind makes <svg>
            display:block) stays on the same line as the text */}
        {children && <span className="inline-flex items-center gap-2">{children}</span>}
        {!isLoading && rightIcon && (
          <span className="inline-flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
