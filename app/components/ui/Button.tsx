import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

/**
 * Definición de variantes para el componente Button
 */
const buttonVariants = cva(
  // Estilos base
  "inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit disabled:hover:scale-100 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-xl",
  {
    variants: {
      variant: {
        // Primario: Verde (acción principal)
        primary:
          "bg-brand-verde text-white hover:bg-[#3ca340] active:scale-95 dark:bg-brand-verde/80 dark:hover:bg-brand-verde focus-visible:ring-brand-verde/50 backdrop-blur-md shadow-lg shadow-brand-verde/20 hover:shadow-xl hover:shadow-brand-verde/30",
        // Secundario: Naranja (acciones alternativas)
        secondary:
          "bg-brand-naranja text-white hover:bg-[#de6615] active:scale-95 dark:bg-brand-naranja/80 dark:hover:bg-brand-naranja focus-visible:ring-brand-naranja/50 backdrop-blur-md shadow-lg shadow-brand-naranja/20 hover:shadow-xl hover:shadow-brand-naranja/30",
        // Peligro: Rojo (acciones destructivas)
        danger:
          "bg-red-500 text-white hover:bg-red-600 active:scale-95 dark:bg-red-500/80 dark:hover:bg-red-500 focus-visible:ring-red-500/50 backdrop-blur-md shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30",
        // Ghost: Transparente (acciones secundarias)
        ghost:
          "bg-transparent text-gray-700 hover:bg-white/40 active:scale-95 dark:text-gray-300 dark:hover:bg-gray-800/40 focus-visible:ring-brand-azul/50",
        // Outline: Con borde
        outline:
          "border-2 border-brand-azul/50 bg-white/10 text-brand-azul hover:bg-brand-azul/10 active:scale-95 dark:border-brand-azul/40 dark:text-blue-400 dark:hover:bg-brand-azul/20 focus-visible:ring-brand-azul/50 backdrop-blur-md",
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
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="inline-flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
