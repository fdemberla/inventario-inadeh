import React from "react";
import { cn } from "@/lib/utils";

type IconButtonVariant = "ghost" | "outline" | "primary" | "danger";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Required: an icon-only button has no visible text (WCAG 4.1.2). */
  "aria-label": string;
  variant?: IconButtonVariant;
  children: React.ReactNode;
}

const variants: Record<IconButtonVariant, string> = {
  ghost: "text-fg-muted hover:bg-surface-muted hover:text-fg",
  outline: "border border-line-strong text-fg hover:bg-surface-muted",
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  danger: "bg-danger text-on-primary hover:bg-danger-hover",
};

/**
 * Botón solo con ícono. 40×40 px, 44×44 en pantallas táctiles.
 *
 * @example
 * <IconButton aria-label="Página siguiente" onClick={next}><ChevronRight /></IconButton>
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", type = "button", children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors pointer-coarse:h-11 pointer-coarse:w-11",
        "focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        "[&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

IconButton.displayName = "IconButton";

export { IconButton };
