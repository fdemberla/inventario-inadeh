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
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
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
              "w-full rounded-lg px-4 py-2.5 text-base font-normal transition-all duration-200 ease-in-out",
              // Border y fondo
              "border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800",
              // Texto
              "text-gray-900 placeholder-gray-500 dark:text-gray-100 dark:placeholder-gray-400",
              // Focus
              "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#004A98] focus-visible:outline-none dark:focus-visible:ring-blue-400",
              // Hover
              "hover:border-gray-400 dark:hover:border-gray-500",
              // Disabled
              "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400",
              // Error
              error && "border-red-500 focus-visible:ring-red-500",
              // Con icono
              icon && "pl-10",
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
