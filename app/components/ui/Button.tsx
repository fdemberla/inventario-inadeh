import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Definición de variantes para el componente Button
 */
const buttonVariants = cva(
  // Estilos base
  "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-md",
  {
    variants: {
      variant: {
        // Primario: Verde (acción principal)
        primary:
          "bg-[#44A147] text-white hover:bg-opacity-90 active:bg-opacity-100 dark:bg-[#44A147] dark:hover:bg-opacity-80 focus-visible:ring-green-500",
        // Secundario: Naranja (acciones alternativas)
        secondary:
          "bg-[#ED7625] text-white hover:bg-opacity-90 active:bg-opacity-100 dark:bg-[#ED7625] dark:hover:bg-opacity-80 focus-visible:ring-orange-500",
        // Peligro: Rojo (acciones destructivas)
        danger:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 focus-visible:ring-red-500",
        // Ghost: Transparente (acciones secundarias)
        ghost:
          "bg-transparent text-[#004A98] hover:bg-gray-100 active:bg-gray-200 dark:text-blue-400 dark:hover:bg-gray-700 dark:active:bg-gray-600 focus-visible:ring-blue-500",
        // Outline: Con borde
        outline:
          "border-2 border-[#004A98] bg-transparent text-[#004A98] hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-800 focus-visible:ring-blue-500",
      },
      size: {
        sm: "px-3 py-1.5 text-sm h-8 gap-1",
        md: "px-4 py-2 text-base h-10 gap-2",
        lg: "px-6 py-3 text-base h-12 gap-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
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
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span>{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
