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
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base
          "rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 ease-in-out",
          // Padding
          !noPadding && "p-6",
          // Border
          !noBorder && "border border-gray-200 dark:border-gray-700",
          // Shadow
          !noShadow && "shadow-sm",
          // Hoverable
          hoverable &&
            "hover:shadow-md hover:-translate-y-0.5 cursor-pointer dark:hover:border-gray-600",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
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
      "mb-4 border-b border-gray-200 pb-4 dark:border-gray-700",
      className
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
      "mt-4 border-t border-gray-200 pt-4 dark:border-gray-700",
      className
    )}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardBody, CardFooter };
