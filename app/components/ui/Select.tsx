import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Error message; marks the field invalid (render it via <FormField error>). */
  error?: string;
}

/**
 * Native <select> with the design-system look. Native keeps the phone's
 * own picker, keyboard support and screen-reader semantics.
 * Use inside <FormField label="…"> so it gets an associated label.
 *
 * @example
 * <FormField label="Categoría" required>
 *   <Select value={v} onChange={…}>
 *     <option value="">Seleccione…</option>
 *   </Select>
 * </FormField>
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        aria-invalid={error ? true : props["aria-invalid"]}
        className={cn(
          "w-full cursor-pointer appearance-none rounded-xl py-3 pr-10 pl-4 text-base",
          "border-line-strong bg-surface text-fg border transition-colors duration-150",
          "hover:border-fg-muted",
          "focus-visible:border-focus focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-0",
          "disabled:bg-surface-muted disabled:text-fg-muted disabled:cursor-not-allowed disabled:opacity-70",
          error && "border-danger-fg focus-visible:outline-danger-fg",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-fg-muted pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2"
      />
    </div>
  ),
);

Select.displayName = "Select";

export { Select };
