import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message; marks the field invalid and is announced with it. */
  error?: string;
  /** Visible label. Prefer <FormField>, or pass aria-label when no label is shown. */
  label?: string;
  helperText?: string;
  isSearchInput?: boolean;
  /** Decorative leading icon (hidden from screen readers). */
  icon?: React.ReactNode;
}

const joinIds = (...ids: (string | undefined | false)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

/**
 * Componente Input reutilizable.
 *
 * Con `label`, renderiza su propia etiqueta asociada (htmlFor/id), y el
 * error / texto de ayuda quedan vinculados con aria-describedby.
 *
 * @example
 * <Input label="Nombre" value={value} onChange={...} error={error} />
 * <Input aria-label="Buscar" placeholder="Buscar..." />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      error,
      label,
      helperText,
      // UI-only flag: never forwarded to the DOM
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      isSearchInput,
      disabled,
      icon,
      id: idProp,
      "aria-describedby": describedByProp,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    // Only render (and reference) messages here when Input owns its label;
    // inside <FormField> the field renders them instead.
    const ownsMessages = !!label;
    const errorId = ownsMessages && error ? `${id}-error` : undefined;
    const helperId = ownsMessages && helperText && !error ? `${id}-helper` : undefined;

    const field = (
      <div className="relative w-full">
        {icon && (
          <div
            aria-hidden="true"
            className="text-fg-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          >
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          disabled={disabled}
          ref={ref}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={joinIds(describedByProp, errorId, helperId)}
          className={cn(
            "w-full rounded-xl px-4 py-3 text-base font-normal transition-colors duration-150",
            "border-line-strong bg-surface border",
            "text-fg placeholder:text-fg-muted",
            "focus-visible:border-focus focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-0",
            "hover:border-fg-muted",
            "disabled:bg-surface-muted disabled:text-fg-muted disabled:cursor-not-allowed disabled:opacity-70",
            error &&
              "border-danger-fg focus-visible:border-danger-fg focus-visible:outline-danger-fg",
            icon ? "pl-10" : undefined,
            className,
          )}
          {...props}
        />
      </div>
    );

    if (!ownsMessages) return field;

    return (
      <div className="w-full space-y-2">
        <label htmlFor={id} className="text-fg block text-sm font-semibold">
          {label}
          {props.required && (
            <span aria-hidden="true" className="text-danger-fg ml-1">
              *
            </span>
          )}
        </label>
        {field}
        {errorId && (
          <p id={errorId} role="alert" className="text-danger-fg text-sm font-medium">
            {error}
          </p>
        )}
        {helperId && (
          <p id={helperId} className="text-fg-muted text-xs">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
