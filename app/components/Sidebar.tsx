"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, SidebarItem, SidebarItemGroup, Button } from "flowbite-react";
import {
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineLogout,
  HiUserGroup,
  HiOutlineChevronRight,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";
import { TbRulerMeasure2 } from "react-icons/tb";
import { LuWarehouse } from "react-icons/lu";
import { CiDeliveryTruck } from "react-icons/ci";
import { MdOutlineInventory } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import Image from "next/image";
import type { IconType } from "react-icons";

// Types
type User = {
  id: number;
  username: string;
  role: number;
};

type SidebarLink = {
  label: string;
  path: string;
};

type SidebarSection = {
  key: string;
  label: string;
  icon: IconType;
  links: SidebarLink[];
};

// Constants
const USER_ROLES = {
  ADMIN: 1,
  GENERAL: 2,
} as const;

const SIDEBAR_SECTIONS = {
  ADMIN: [
    {
      key: "inicio",
      label: "Inicio",
      icon: FaHome,
      links: [{ label: "Ir al Inicio", path: "/dashboard" }],
    },
    {
      key: "usuarios",
      label: "Usuarios",
      icon: HiUserGroup,
      links: [
        { label: "Ver Todos", path: "/dashboard/users" },
        { label: "Crear Usuario", path: "/dashboard/users/create" },
      ],
    },
    {
      key: "productos",
      label: "Productos",
      icon: HiOutlineCube,
      links: [
        { label: "Ver Todos", path: "/dashboard/products" },
        { label: "Crear Producto", path: "/dashboard/products/create" },
      ],
    },
    {
      key: "categorias",
      label: "Categorías",
      icon: HiOutlineTag,
      links: [
        { label: "Ver Todas", path: "/dashboard/categories" },
        { label: "Crear Categoría", path: "/dashboard/categories/create" },
      ],
    },
    {
      key: "unidades",
      label: "Unidades de Medida",
      icon: TbRulerMeasure2,
      links: [
        { label: "Ver Todas", path: "/dashboard/units" },
        { label: "Crear Unidad", path: "/dashboard/units/create" },
      ],
    },
    {
      key: "proveedores",
      label: "Proveedores",
      icon: CiDeliveryTruck,
      links: [
        { label: "Ver Todos", path: "/dashboard/suppliers" },
        { label: "Crear Proveedor", path: "/dashboard/suppliers/create" },
      ],
    },
    {
      key: "deposito",
      label: "Depósitos",
      icon: LuWarehouse,
      links: [
        { label: "Ver Todos", path: "/dashboard/warehouse" },
        { label: "Crear Depósito", path: "/dashboard/warehouse/create" },
      ],
    },
    {
      key: "inventario",
      label: "Inventario",
      icon: MdOutlineInventory,
      links: [{ label: "Actualizar Inventario", path: "/dashboard/inventory" }],
    },
  ] as SidebarSection[],
  GENERAL: [
    {
      key: "inicio",
      label: "Inicio",
      icon: FaHome,
      links: [{ label: "Ir al Inicio", path: "/dashboard" }],
    },
    {
      key: "productos",
      label: "Productos",
      icon: HiOutlineCube,
      links: [
        { label: "Ver Todos", path: "/dashboard/products" },
        { label: "Crear Producto", path: "/dashboard/products/create" },
      ],
    },
    {
      key: "inventario",
      label: "Inventario",
      icon: MdOutlineInventory,
      links: [
        { label: "Actualizar Inventario", path: "/dashboard/inventory/update" },
        { label: "Scanner", path: "/dashboard/inventory/update/scanner" },
      ],
    },
  ] as SidebarSection[],
};

interface SidebarComponentProps {
  user: User;
}

export default function SidebarComponent({ user }: SidebarComponentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const pathname = usePathname();

  // Memoized sections based on user role
  const sections = useMemo(() => {
    return user.role === USER_ROLES.ADMIN
      ? SIDEBAR_SECTIONS.ADMIN
      : SIDEBAR_SECTIONS.GENERAL;
  }, [user.role]);

  // Callbacks
  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const isActive = useCallback(
    (path: string) => {
      return pathname?.startsWith(path);
    },
    [pathname],
  );

  const handleNavigation = useCallback(
    (path: string) => {
      router.push(path);
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 768) {
        closeSidebar();
      }
    },
    [router, closeSidebar],
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      // Still redirect even if logout fails
      router.push("/login");
    }
  }, [router]);

  // Loading state
  if (!user) {
    return (
      <div className="bg-brand-azul h-screen w-64 animate-pulse">
        <div className="p-6">
          <div className="h-12 w-12 rounded-full bg-white/20"></div>
        </div>
      </div>
    );
  }

  const renderSection = (section: SidebarSection) => {
    const isOpen = openSections[section.key];
    const Icon = section.icon;
    const hasLinks = section.links.length > 0;

    return (
      <div key={section.key} className="mb-1">
        {/* Section Header */}
        <div
          className={`hover:bg-brand-naranja focus:ring-brand-naranja/50 flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all duration-200 ease-in-out focus:ring-2 focus:outline-none ${isOpen ? "bg-brand-naranja/80" : "bg-brand-azul"} `}
          onClick={() => hasLinks && toggleSection(section.key)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && hasLinks) {
              e.preventDefault();
              toggleSection(section.key);
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={hasLinks ? isOpen : undefined}
          aria-controls={hasLinks ? `section-${section.key}` : undefined}
        >
          <div className="flex items-center gap-3">
            <Icon className="flex-shrink-0 text-base" aria-hidden="true" />
            <span className="truncate">{section.label}</span>
          </div>
          {hasLinks && (
            <div
              className={`flex-shrink-0 transform transition-transform duration-200 ease-in-out ${isOpen ? "rotate-90" : ""} `}
              aria-hidden="true"
            >
              <HiOutlineChevronRight />
            </div>
          )}
        </div>

        {/* Section Links */}
        {hasLinks && (
          <div
            id={`section-${section.key}`}
            className={`overflow-hidden pl-4 transition-all duration-200 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} `}
            aria-hidden={!isOpen}
          >
            <div className="flex flex-col space-y-1 py-2">
              {section.links.map((link) => (
                <SidebarItem
                  key={link.path}
                  onClick={() => handleNavigation(link.path)}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-sm text-white transition-colors duration-150 hover:bg-amber-600 focus:ring-2 focus:ring-amber-600/50 focus:outline-none ${
                    isActive(link.path)
                      ? "bg-amber-600 font-medium"
                      : "bg-brand-azul hover:bg-brand-azul/80"
                  } `}
                >
                  <span className="truncate">{link.label}</span>
                </SidebarItem>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-brand-azul">
      {/* Mobile Header */}
      <div className="bg-brand-azul flex items-center justify-between p-4 text-white md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Image
              src="/favicon.png"
              alt="Logo"
              width={24}
              height={24}
              className="rounded-full"
            />
          </div>
          <span className="font-semibold">Hola, {user.username}!</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 hover:bg-white/10 focus:ring-2 focus:ring-white/20 focus:outline-none"
          aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {sidebarOpen ? (
            <HiOutlineX className="h-6 w-6" />
          ) : (
            <HiOutlineMenu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`bg-brand-azul fixed top-0 left-0 z-40 h-full w-64 transform text-white transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}
        aria-label="Sidebar de navegación"
      >
        {/* Desktop Logo */}
        <div className="hidden items-center justify-center border-b border-white/20 p-6 md:flex">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Image
              src="/favicon.png"
              alt="Logo de la aplicación"
              width={48}
              height={48}
              className="rounded-full"
            />
          </div>
        </div>

        {/* Desktop User Greeting */}
        <div className="hidden p-4 text-center text-lg font-bold md:block">
          <span className="truncate">Hola, {user.username}!</span>
        </div>

        <div className="flex h-[calc(100%-180px)] flex-col justify-between md:h-[calc(100%-120px)]">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <Sidebar
              aria-label="Navegación principal"
              className="bg-brand-azul [&>div]:bg-brand-azul"
            >
              <SidebarItemGroup className="bg-brand-azul [&>div]:bg-brand-azul space-y-2">
                {sections.map(renderSection)}
              </SidebarItemGroup>
            </Sidebar>
          </nav>

          {/* Logout Button */}
          <div className="bg-brand-azul border-t border-white/10 p-4">
            <Button
              onClick={handleLogout}
              className={`w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-700 focus:ring-2 focus:ring-red-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <div className="flex items-center justify-center gap-2">
                <HiOutlineLogout className="flex-shrink-0" aria-hidden="true" />
                <span>Cerrar Sesión</span>
              </div>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeSidebar}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              closeSidebar();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú lateral"
        />
      )}
    </div>
  );
}
