import React, { useId } from "react";
import { Input, type InputProps } from "./Input";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends Omit<InputProps, "label"> {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  description?: string;
  /**
   * Custom control instead of the default <Input>. A single element child
   * receives `id`, `aria-describedby`, `aria-invalid` and `required` so the
   * label and messages stay associated with it.
   */
  children?: React.ReactNode;
}

const joinIds = (...ids: (string | undefined | false)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

/**
 * Campo de formulario con etiqueta, descripción, error y ayuda, todos
 * asociados al control (WCAG 1.3.1, 3.3.1, 3.3.2, 4.1.2).
 *
 * @example
 * <FormField
 *   label="Correo electrónico"
 *   type="email"
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
      id: idProp,
      ...inputProps
    },
    ref,
  ) => {
    const autoId = useId();
    const child =
      React.Children.count(children) === 1 && React.isValidElement(children)
        ? (children as React.ReactElement<Record<string, unknown>>)
        : null;
    // The control's id: explicit prop, the custom child's own id, or generated
    const id = idProp ?? (child?.props.id as string | undefined) ?? autoId;

    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText && !error ? `${id}-helper` : undefined;
    const describedBy = joinIds(descriptionId, errorId, helperId);

    let control: React.ReactNode;
    if (child) {
      control = React.cloneElement(child, {
        id,
        "aria-describedby": joinIds(
          child.props["aria-describedby"] as string | undefined,
          describedBy,
        ),
        "aria-invalid": error ? true : child.props["aria-invalid"],
        required: (child.props.required as boolean | undefined) ?? (required || undefined),
      });
    } else if (children) {
      control = children; // several nodes: caller is responsible for ids
    } else {
      control = (
        <Input
          ref={ref}
          id={id}
          error={error}
          required={required}
          aria-describedby={describedBy}
          {...inputProps}
        />
      );
    }

    return (
      <div className={cn("w-full space-y-2", className)}>
        <label htmlFor={id} className="text-fg block text-sm font-semibold">
          {label}
          {required && (
            // Visual cue only; the control's `required` is what is announced
            <span aria-hidden="true" className="text-danger-fg ml-1">
              *
            </span>
          )}
        </label>

        {description && (
          <p id={descriptionId} className="text-fg-muted text-xs">
            {description}
          </p>
        )}

        {control}

        {error && (
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

FormField.displayName = "FormField";

export { FormField };
