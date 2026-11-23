import React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

// Tinted background + strong text; every pair ≥ 4.5:1 in light and dark
const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-fg",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger-fg",
  info: "bg-accent/10 text-accent",
};

/**
 * Etiqueta de estado. No dependas solo del color: incluye texto (WCAG 1.4.1).
 *
 * @example
 * <Badge tone="success"><Wifi aria-hidden /> En línea</Badge>
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = "neutral", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:h-3.5 [&_svg]:w-3.5",
        tones[tone],
        className,
      )}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";

export { Badge };
