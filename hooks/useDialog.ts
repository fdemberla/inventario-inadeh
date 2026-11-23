"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseDialogOptions {
  /** Called on Escape (omit to make Escape do nothing). */
  onEscape?: () => void;
  /**
   * Element to focus on open, or a region whose first control gets focus.
   * Defaults to the first focusable element in the dialog.
   */
  initialFocus?: RefObject<HTMLElement | null>;
}

/**
 * Modal dialog behaviour (WCAG 2.1.2 / 2.4.3 and the ARIA dialog pattern):
 * - moves focus into the dialog when it opens
 * - keeps Tab / Shift+Tab inside it
 * - Escape calls `onEscape`
 * - locks page scroll while open
 * - returns focus to the element that opened it when it closes
 */
export function useDialog(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  { onEscape, initialFocus }: UseDialogOptions = {},
) {
  // Keep the latest callback without re-running the effect on every render
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    const opener = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      container
        ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (el) => el.offsetParent !== null || el === document.activeElement,
          )
        : [];

    // initialFocus may be a control or a region: in a region, focus its
    // first control (e.g. the first form field of a modal's body)
    const target = initialFocus?.current;
    const initial =
      target && !target.matches(FOCUSABLE)
        ? target.querySelector<HTMLElement>(FOCUSABLE)
        : target;
    (initial ?? focusables()[0] ?? container)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscapeRef.current) {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !container.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !container.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Return focus to whatever opened the dialog, if it is still on the page
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [open, containerRef, initialFocus]);
}
