"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutGrid, LogOut, X } from "lucide-react";
import {
  getNavSections,
  isPathActive,
  isSectionActive,
  type NavSection,
} from "@/lib/navigation";
import { stripBasePath, withBasePath } from "@/lib/utils";
import { useDialog } from "@/hooks/useDialog";

type User = {
  id: number;
  username: string;
  role: number;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const itemBase =
  "flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const itemIdle =
  "text-fg-muted hover:bg-surface-muted hover:text-accent";
const itemActive =
  "bg-accent/10 font-semibold text-accent";

export default function BottomMenu({ user }: { user: User }) {
  const pathname = stripBasePath(usePathname() ?? "");
  const sections = useMemo(() => getNavSections(user.role), [user.role]);
  const primary = sections.filter((s) => s.primary).slice(0, 4);
  const more = sections.filter((s) => !primary.includes(s));

  const [open, setOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  // Close the sheet whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Focus trap, Escape, scroll lock and focus return to "Más"
  useDialog(open, panelRef, { onEscape: close });

  const handleLogout = async () => {
    // signOut sets window.location directly, so the callbackUrl needs the basePath
    await signOut({ callbackUrl: withBasePath("/login") });
  };

  const moreIsActive = more.some((s) => isSectionActive(pathname, s));
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex items-stretch gap-1 px-2 py-1.5">
          {primary.map((section) => {
            const active = isSectionActive(pathname, section);
            const Icon = section.icon;
            return (
              <li key={section.key} className="flex flex-1">
                <Link
                  href={section.path}
                  aria-current={active ? "page" : undefined}
                  className={`${itemBase} ${active ? itemActive : itemIdle}`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" strokeWidth={active ? 2.25 : 1.75} />
                  <span>{section.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button
              ref={moreButtonRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={panelId}
              aria-haspopup="dialog"
              className={`${itemBase} ${open || moreIsActive ? itemActive : itemIdle}`}
            >
              <LayoutGrid className="h-6 w-6" aria-hidden="true" />
              <span>Más</span>
            </button>
          </li>
        </ul>
      </nav>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={close}
            className="animate-fade-in absolute inset-0 h-full w-full cursor-default bg-black/50"
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="animate-slide-up absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-surface pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-fg">
                  Menú
                </h2>
                <p className="truncate text-sm text-fg-muted">
                  {displayName}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar menú"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {more.length > 0 && (
              <ul className="px-2 py-2">
                {more.map((section) => (
                  <MoreSection key={section.key} section={section} pathname={pathname} />
                ))}
              </ul>
            )}

            <div className="border-t border-line px-2 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-medium text-danger-fg hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-danger-fg"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MoreSection({ section, pathname }: { section: NavSection; pathname: string }) {
  const Icon = section.icon;
  const active = isSectionActive(pathname, section);
  // Extra links besides the section's main page (e.g. "Crear …")
  const extra = section.links.filter((l) => l.path !== section.path);

  return (
    <li className="py-0.5">
      <Link
        href={section.path}
        aria-current={isPathActive(pathname, section.path) ? "page" : undefined}
        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium focus-visible:outline-2 focus-visible:outline-focus ${
          active
            ? "bg-accent/10 text-accent"
            : "text-fg hover:bg-surface-muted"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {section.label}
      </Link>
      {extra.length > 0 && (
        <ul className="ml-11">
          {extra.map((link) => (
            <li key={link.path}>
              <Link
                href={link.path}
                aria-current={pathname === link.path ? "page" : undefined}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm text-fg-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus aria-[current=page]:font-semibold aria-[current=page]:text-accent"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
