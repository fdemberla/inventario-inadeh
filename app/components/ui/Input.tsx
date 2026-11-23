import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  isSearchInput?: boolean;
  icon?: React.ReactNode;
}

/**
 * Componente Input reutilizable
 *
 * @example
 * <Input
 *   type="text"
 *   placeholder="Nombre"
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   error={error}
 * />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      placeholder,
      error,
      label,
      helperText,
      disabled,
      icon,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          ref={ref}
          className={cn(
            // Base styles
            "w-full rounded-xl px-4 py-3 text-base font-normal transition-all duration-300 ease-out",
            // Border y fondo
            "border border-white/50 bg-white/40 dark:border-white/10 dark:bg-gray-900/40 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]",
            // Texto
            "text-gray-900 placeholder-gray-500 dark:text-gray-100 dark:placeholder-gray-400",
            // Focus
            "focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-gray-800/70 focus-visible:ring-2 focus-visible:ring-brand-azul/50 focus-visible:border-brand-azul/30",
            // Hover
            "hover:bg-white/60 dark:hover:bg-gray-800/60 hover:border-white/60 dark:hover:border-white/20",
            // Disabled
            "disabled:cursor-not-allowed disabled:bg-gray-100/50 disabled:text-gray-500 dark:disabled:bg-gray-800/30 dark:disabled:text-gray-500 dark:disabled:border-gray-800",
            // Error
            error && "border-red-400 bg-red-50/50 dark:border-red-500/50 dark:bg-red-900/10 focus-visible:ring-red-400/50 focus-visible:border-red-400",
            // Con icono
            icon && "pl-10",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
