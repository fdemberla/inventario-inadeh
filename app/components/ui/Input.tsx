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
      // TODO(fase 5, WCAG): render label/helperText with useId(); for now they
      // are only pulled out so they are not forwarded to the DOM <input>.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      label,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted">
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
            "border border-line-strong bg-surface",
            // Texto
            "text-fg placeholder:text-fg-muted",
            // Focus
            "focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus",
            // Hover
            "hover:border-fg-muted",
            // Disabled
            "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-muted disabled:opacity-70",
            // Error
            error && "border-danger-fg focus-visible:border-danger-fg focus-visible:outline-danger-fg",
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
