import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  noBorder?: boolean;
  noShadow?: boolean;
  hoverable?: boolean;
}

/**
 * Componente Card reutilizable
 *
 * @example
 * <Card>
 *   <Card.Header>Título</Card.Header>
 *   <Card.Body>Contenido</Card.Body>
 *   <Card.Footer>Pie de página</Card.Footer>
 * </Card>
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      children,
      noPadding = false,
      noBorder = false,
      noShadow = false,
      hoverable = false,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base
          "rounded-2xl bg-white/40 transition-all duration-300 ease-out dark:bg-gray-900/40 backdrop-blur-lg backdrop-filter",
          // Padding
          !noPadding && "p-6",
          // Border
          !noBorder && "border border-white/50 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
          // Shadow
          !noShadow && "shadow-xl shadow-black/5 dark:shadow-black/20",
          // Hoverable
          hoverable &&
            "cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:bg-white/50 dark:hover:bg-gray-800/50 hover:border-white/60 dark:hover:border-white/20",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

/**
 * CardHeader - Encabezado de la tarjeta
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mb-4 border-b border-white/20 pb-4 dark:border-white/10",
      className,
    )}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

/**
 * CardBody - Cuerpo de la tarjeta
 */
const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));

CardBody.displayName = "CardBody";

/**
 * CardFooter - Pie de página de la tarjeta
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-4 border-t border-white/20 pt-4 dark:border-white/10",
      className,
    )}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardBody, CardFooter };
