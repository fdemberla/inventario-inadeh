// lib/navigation.ts
// Single source of truth for the app navigation (desktop Sidebar and mobile
// BottomMenu). Items are filtered by role; the middleware and the APIs
// enforce the same rules, this only decides what is shown.
import type { LucideIcon } from "lucide-react";
import {
  ChartColumn,
  ClipboardList,
  House,
  Package,
  Ruler,
  Tags,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { USER_ROLES } from "@/lib/constants";

export interface NavLink {
  label: string;
  path: string;
  adminOnly?: boolean;
}

export interface NavSection {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Main destination of the section (used by the mobile menu). */
  path: string;
  links: NavLink[];
  adminOnly?: boolean;
  /** Shown in the mobile bottom bar (max 4); the rest go under "Más". */
  primary?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    key: "inicio",
    label: "Inicio",
    icon: House,
    path: "/dashboard",
    primary: true,
    links: [{ label: "Ir al Inicio", path: "/dashboard" }],
  },
  {
    key: "inventario",
    label: "Inventario",
    icon: ClipboardList,
    path: "/dashboard/inventory",
    primary: true,
    links: [{ label: "Actualizar Inventario", path: "/dashboard/inventory" }],
  },
  {
    key: "productos",
    label: "Productos",
    icon: Package,
    path: "/dashboard/products",
    primary: true,
    links: [
      { label: "Ver Todos", path: "/dashboard/products" },
      { label: "Crear Producto", path: "/dashboard/products/create", adminOnly: true },
    ],
  },
  {
    key: "reportes",
    label: "Reportes",
    icon: ChartColumn,
    path: "/dashboard/reports",
    primary: true,
    links: [{ label: "Ver Reportes", path: "/dashboard/reports" }],
  },
  {
    key: "categorias",
    label: "Categorías",
    icon: Tags,
    path: "/dashboard/categories",
    adminOnly: true,
    links: [
      { label: "Ver Todas", path: "/dashboard/categories" },
      { label: "Crear Categoría", path: "/dashboard/categories/create" },
    ],
  },
  {
    key: "unidades",
    label: "Unidades de Medida",
    icon: Ruler,
    path: "/dashboard/units",
    adminOnly: true,
    links: [
      { label: "Ver Todas", path: "/dashboard/units" },
      { label: "Crear Unidad", path: "/dashboard/units/create" },
    ],
  },
  {
    key: "proveedores",
    label: "Proveedores",
    icon: Truck,
    path: "/dashboard/suppliers",
    adminOnly: true,
    links: [
      { label: "Ver Todos", path: "/dashboard/suppliers" },
      { label: "Crear Proveedor", path: "/dashboard/suppliers/create" },
    ],
  },
  {
    key: "depositos",
    label: "Depósitos",
    icon: Warehouse,
    path: "/dashboard/warehouse",
    adminOnly: true,
    links: [
      { label: "Ver Todos", path: "/dashboard/warehouse" },
      { label: "Crear Depósito", path: "/dashboard/warehouse/create" },
    ],
  },
  {
    key: "usuarios",
    label: "Usuarios",
    icon: Users,
    path: "/dashboard/users",
    adminOnly: true,
    links: [
      { label: "Ver Todos", path: "/dashboard/users" },
      { label: "Crear Usuario", path: "/dashboard/users/create" },
    ],
  },
];

/** Sections and links visible to the given role. */
export function getNavSections(role: number | undefined): NavSection[] {
  const isAdmin = role === USER_ROLES.ADMIN;
  return NAV_SECTIONS.filter((s) => isAdmin || !s.adminOnly).map((s) => ({
    ...s,
    links: s.links.filter((l) => isAdmin || !l.adminOnly),
  }));
}

/**
 * Whether `path` is the current page or a page inside it.
 * "/dashboard" only matches itself; "/create" pages only match their own link.
 */
export function isPathActive(current: string, path: string): boolean {
  if (current === path) return true;
  if (path === "/dashboard") return false;
  if (!current.startsWith(path + "/")) return false;
  return !current.endsWith("/create");
}

/** Whether the current page belongs to the section (any of its links). */
export function isSectionActive(current: string, section: NavSection): boolean {
  if (section.path === "/dashboard") return current === "/dashboard";
  return current === section.path || current.startsWith(section.path + "/");
}
