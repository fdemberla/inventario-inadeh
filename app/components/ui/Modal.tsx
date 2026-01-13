"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  isDismissable?: boolean;
}

/**
 * Componente Modal personalizado
 *
 * @example
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirmación">
 *   <p>¿Está seguro de que desea continuar?</p>
 *   <Modal.Footer>
 *     <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
 *     <Button variant="primary" onClick={handleConfirm}>Confirmar</Button>
 *   </Modal.Footer>
 * </Modal>
 */
const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      footer,
      closeButton = true,
      size = "md",
      isDismissable = true,
    },
    ref,
  ) => {
    // Prevenir scroll del body cuando el modal está abierto
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (isDismissable && e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <>
        {/* Overlay oscuro */}
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black transition-opacity duration-300 ease-in-out"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Contenedor del modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          {/* Modal card */}
          <div
            ref={ref}
            className={cn(
              "animate-in fade-in zoom-in-95 relative w-full rounded-xl bg-white shadow-xl duration-300 ease-out dark:bg-gray-800 dark:shadow-2xl",
              sizeClasses[size],
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {/* Header */}
            {(title || closeButton) && (
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <div>
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-bold text-gray-900 dark:text-white"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {description}
                    </p>
                  )}
                </div>
                {closeButton && (
                  <button
                    onClick={onClose}
                    className="ml-4 inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    aria-label="Cerrar modal"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                {footer}
              </div>
            )}
          </div>
        </div>
      </>
    );
  },
);

Modal.displayName = "Modal";

/**
 * ModalFooter - Footer del modal con acciones
 */
const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex justify-end gap-3", className)}
    {...props}
  />
));

ModalFooter.displayName = "ModalFooter";

export { Modal, ModalFooter };
