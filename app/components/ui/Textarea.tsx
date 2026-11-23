import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error message; marks the field invalid (render it via <FormField error>). */
  error?: string;
}

/**
 * Multi-line text field with the design-system look.
 * Use inside <FormField label="…"> so it gets an associated label.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={error ? true : props["aria-invalid"]}
      className={cn(
        "w-full rounded-xl px-4 py-3 text-base",
        "border-line-strong bg-surface text-fg placeholder:text-fg-muted border transition-colors duration-150",
        "hover:border-fg-muted",
        "focus-visible:border-focus focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-0",
        "disabled:bg-surface-muted disabled:text-fg-muted disabled:cursor-not-allowed disabled:opacity-70",
        error && "border-danger-fg focus-visible:outline-danger-fg",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";

export { Textarea };
