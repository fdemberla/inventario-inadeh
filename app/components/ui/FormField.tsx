import React from "react";
import { Input, type InputProps } from "./Input";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends Omit<InputProps, "label"> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Componente FormField que envuelve Input con Label y mensajes de error
 *
 * @example
 * <FormField
 *   label="Correo electrónico"
 *   type="email"
 *   placeholder="ejemplo@correo.com"
 *   required
 *   error={errors.email}
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 * />
 */
const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      description,
      className,
      children,
      ...inputProps
    },
    ref,
  ) => {
    return (
      <div className={cn("w-full space-y-2", className)}>
        {/* Label con indicador de requerido */}
        <div className="flex items-center gap-1">
          <label className="text-sm font-semibold text-fg">
            {label}
          </label>
          {required && (
            <span
              className="text-danger-fg"
              aria-label="Requerido"
            >
              *
            </span>
          )}
        </div>

        {/* Descripción adicional */}
        {description && (
          <p className="text-xs text-fg-muted">
            {description}
          </p>
        )}

        {/* Input o Custom Children */}
        {children ? (
          children
        ) : (
          <Input
            ref={ref}
            error={error}
            aria-invalid={!!error}
            aria-describedby={error ? `${label}-error` : undefined}
            {...inputProps}
          />
        )}

        {/* Mensaje de error */}
        {error && (
          <p
            id={`${label}-error`}
            className="text-sm font-medium text-danger-fg"
          >
            {error}
          </p>
        )}

        {/* Texto auxiliar */}
        {helperText && !error && (
          <p className="text-xs text-fg-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = "FormField";

export { FormField };
