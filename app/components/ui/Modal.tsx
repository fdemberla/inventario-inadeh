"use client";

import React, { useCallback, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/useDialog";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  /** Allow closing with Escape and by clicking the backdrop. */
  isDismissable?: boolean;
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
};

/**
 * Accessible modal dialog (ARIA dialog pattern): focus moves inside and is
 * trapped, Escape closes it, focus returns to the opener, page scroll is
 * locked. Bottom sheet on phones, centred card from `sm` up.
 *
 * @example
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirmación"
 *   footer={<ModalFooter>…</ModalFooter>}>
 *   <p>¿Está seguro de que desea continuar?</p>
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
    forwardedRef,
  ) => {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const titleId = useId();
    const descriptionId = useId();

    // Focus the first control in the body (e.g. a form field); falls back to "Cerrar"
    useDialog(isOpen, panelRef, {
      onEscape: isDismissable ? onClose : undefined,
      initialFocus: bodyRef,
    });

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        panelRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    if (!isOpen || typeof document === "undefined") return null;

    // Rendered in a portal on <body>: an ancestor with its own stacking context
    // (e.g. PageLayout's `relative z-10`) would otherwise trap the modal below
    // the mobile BottomMenu. z-[60] = above BottomMenu (z-50), like its "Más" sheet.
    return createPortal(
      <div className="fixed inset-0 z-[60]">
        {/* Backdrop */}
        <div
          aria-hidden="true"
          onClick={isDismissable ? onClose : undefined}
          className="animate-fade-in absolute inset-0 bg-black/50"
        />

        <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
          <div
            ref={setRefs}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn(
              "pointer-events-auto relative flex w-full flex-col",
              "border-line bg-surface text-fg border shadow-2xl",
              // Phone: bottom sheet. sm+: centred card.
              "max-h-[90dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)] max-sm:animate-slide-up",
              "sm:max-h-[85vh] sm:animate-zoom-in sm:rounded-2xl sm:pb-0",
              "focus:outline-none",
              sizeClasses[size],
            )}
          >
            {(title || closeButton) && (
              <div className="border-line flex shrink-0 items-start justify-between gap-4 border-b px-6 py-4">
                <div className="min-w-0">
                  {title && (
                    <h2 id={titleId} className="text-fg text-lg font-bold">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="text-fg-muted mt-1 text-sm">
                      {description}
                    </p>
                  )}
                </div>
                {closeButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline-focus -mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>

            {footer && (
              <div className="border-line shrink-0 border-t px-6 py-4">{footer}</div>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );
  },
);

Modal.displayName = "Modal";

/**
 * ModalFooter - acciones del modal. En celular los botones ocupan el ancho
 * completo y se apilan (acción principal arriba).
 */
const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto",
      className,
    )}
    {...props}
  />
));

ModalFooter.displayName = "ModalFooter";

export { Modal, ModalFooter };
