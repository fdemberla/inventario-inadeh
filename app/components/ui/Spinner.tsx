import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin rounded-full", {
  variants: {
    size: {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-[3px]",
      lg: "h-10 w-10 border-4",
      xl: "h-16 w-16 border-4",
    },
    color: {
      primary: "border-line border-t-accent",
      white: "border-white/30 border-t-white",
      info: "border-blue-100 border-t-blue-600 dark:border-blue-900/30 dark:border-t-blue-400",
      success: "border-green-100 border-t-green-600 dark:border-green-900/30 dark:border-t-green-400",
      warning: "border-yellow-100 border-t-yellow-600 dark:border-yellow-900/30 dark:border-t-yellow-400",
      danger: "border-red-100 border-t-red-600 dark:border-red-900/30 dark:border-t-red-400",
      neutral: "border-gray-200 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-400",
    },
  },
  defaultVariants: {
    size: "md",
    color: "primary",
  },
});

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  label?: string;
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, color, label = "Cargando...", ...props }, ref) => {
    return (
      <div className="inline-flex items-center justify-center" role="status">
        <div
          ref={ref}
          className={cn(spinnerVariants({ size, color, className }))}
          {...props}
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";
