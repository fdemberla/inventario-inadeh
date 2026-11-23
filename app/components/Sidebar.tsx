"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/app/components/ui";
import {
  getNavSections,
  isPathActive,
  isSectionActive,
  type NavSection,
} from "@/lib/navigation";
import { stripBasePath, withBasePath } from "@/lib/utils";

type User = {
  id: number;
  username: string;
  role: number;
  firstName?: string;
  lastName?: string;
  email?: string;
};

interface SidebarComponentProps {
  user: User;
}

/**
 * Desktop navigation (md and up). On phones the layout hides it and
 * BottomMenu takes over; both read lib/navigation.ts.
 */
export default function SidebarComponent({ user }: SidebarComponentProps) {
  const router = useRouter();
  const pathname = stripBasePath(usePathname() ?? "");
  const sections = useMemo(() => getNavSections(user?.role), [user?.role]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Keep the section of the current page expanded
  useEffect(() => {
    const current = sections.find((s) => isSectionActive(pathname, s));
    if (current) setOpenSections((prev) => ({ ...prev, [current.key]: true }));
  }, [pathname, sections]);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // signOut sets window.location directly, so the callbackUrl needs the basePath
      await signOut({ callbackUrl: withBasePath("/login") });
    } catch (error) {
      console.error("Error during logout:", error);
      router.push("/login"); // router.push adds the basePath itself
    }
  }, [router]);

  if (!user) {
    return <div className="bg-brand-azul h-screen w-72 animate-pulse" />;
  }

  return (
    <div className="bg-brand-azul sticky top-0 flex h-screen w-72 flex-col text-white">
      <div className="flex flex-col items-center gap-3 border-b border-white/20 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <Image
            src={withBasePath("/favicon.png")}
            alt="INADEH Inventario"
            width={48}
            height={48}
            className="rounded-full"
          />
        </div>
        <p className="max-w-full truncate text-lg font-bold">Hola, {user.username}</p>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {sections.map((section) => (
            <SidebarSection
              key={section.key}
              section={section}
              pathname={pathname}
              open={!!openSections[section.key]}
              onToggle={toggleSection}
            />
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/20 p-4">
        <Button
          onClick={handleLogout}
          variant="danger"
          className="w-full"
          leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />}
        >
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}

const rowBase =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function SidebarSection({
  section,
  pathname,
  open,
  onToggle,
}: {
  section: NavSection;
  pathname: string;
  open: boolean;
  onToggle: (key: string) => void;
}) {
  const Icon = section.icon;
  const sectionActive = isSectionActive(pathname, section);

  // A section with a single link is just a link (e.g. Inicio, Reportes)
  if (section.links.length <= 1) {
    const path = section.links[0]?.path ?? section.path;
    const active = isPathActive(pathname, path) || sectionActive;
    return (
      <li>
        <Link
          href={path}
          aria-current={active ? "page" : undefined}
          className={`${rowBase} font-semibold ${active ? "bg-white/20" : "hover:bg-white/10"}`}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{section.label}</span>
        </Link>
      </li>
    );
  }

  const listId = `nav-${section.key}`;
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(section.key)}
        aria-expanded={open}
        aria-controls={listId}
        className={`${rowBase} justify-between font-semibold ${
          sectionActive && !open ? "bg-white/20" : open ? "bg-white/10" : "hover:bg-white/10"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{section.label}</span>
        </span>
        <ChevronRight
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
      </button>
      {/* Not rendered when collapsed, so hidden links are never tabbable */}
      {open && (
        <ul id={listId} className="mt-1 space-y-1 pl-8">
          {section.links.map((link) => {
            const active = isPathActive(pathname, link.path);
            return (
              <li key={link.path}>
                <Link
                  href={link.path}
                  aria-current={active ? "page" : undefined}
                  className={`${rowBase} ${active ? "bg-white/20 font-medium" : "hover:bg-white/10"}`}
                >
                  <span className="truncate">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
