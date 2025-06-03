"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, SidebarItem, SidebarItemGroup, Button } from "flowbite-react";
import {
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineLogout,
  HiUserGroup,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { TbRulerMeasure2 } from "react-icons/tb";
import { LuWarehouse } from "react-icons/lu";
import { CiDeliveryTruck } from "react-icons/ci";
import { MdOutlineInventory } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import Image from "next/image";
import type { IconType } from "react-icons";

type User = {
  id: number;
  username: string;
  role: number;
};

type SidebarSection = {
  key: string;
  label: string;
  icon: IconType;
  links: { label: string; path: string }[];
};

export default function SidebarComponent({ user }: { user: User }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const pathname = usePathname();

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (path: string) => pathname?.startsWith(path);

  const adminSections: SidebarSection[] = [
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
      links: [
        { label: "Actualizar Inventario", path: "/dashboard/inventory/update" },

        { label: "Scanner", path: "/dashboard/inventory/update/scanner" },
      ],
    },
  ];

  const generalSections: SidebarSection[] = [
    {
      key: "ver_inventario",
      label: "Inventario",
      icon: MdOutlineInventory,
      links: [
        { label: "Ver Inventario", path: "/user-dashboard/view-inventory" },
      ],
    },
  ];

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  const renderSection = (section: SidebarSection) => {
    const isOpen = openSections[section.key];

    const Icon = section.icon;

    return (
      <div key={section.key} className="bg-brand-azul mb-1">
        {/* Section Header */}
        <div
          className={`hover:bg-brand-naranja flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all duration-300 ${
            isOpen ? "bg-brand-naranja/80" : ""
          }`}
          onClick={() => toggleSection(section.key)}
        >
          <div className="flex items-center gap-3">
            <Icon className="text-base" />
            <span>{section.label}</span>
          </div>
          {section.links.length > 0 && (
            <div
              className={`transform transition-transform duration-300 ${
                isOpen ? "rotate-90" : ""
              }`}
            >
              <HiOutlineChevronRight />
            </div>
          )}
        </div>

        {/* Section Links */}
        {section.links.length > 0 && (
          <div
            className={`overflow-hidden pl-4 transition-all duration-300 ease-in-out ${
              isOpen ? "max-h-[999px]" : "max-h-0"
            }`}
          >
            <div className="flex flex-col space-y-1 py-2">
              {section.links.map((link) => (
                <SidebarItem
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className={`rounded-lg px-4 py-2 text-sm text-white hover:bg-amber-600 ${
                    isActive(link.path)
                      ? "bg-amber-600 font-medium"
                      : "bg-brand-azul"
                  }`}
                >
                  {link.label}
                </SidebarItem>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="bg-brand-azul">
      {/* Mobile Hamburger */}
      <div className="bg-brand-azul flex items-center p-4 text-white md:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar Drawer */}
      <div
        className={`bg-brand-azul fixed top-0 left-0 z-40 h-full w-64 transform text-white transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        {/* Logo Placeholder */}
        <div className="flex items-center justify-center border-b border-white/20 p-6 text-center text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
            <Image src={"/favicon.png"} alt="logo" width={100} height={100} />
          </div>
        </div>

        {/* User Greeting */}
        <div className="hidden p-4 text-center text-lg font-bold md:block">
          Hola, {user.username}!
        </div>

        <div className="flex h-[calc(100%-180px)] flex-col justify-between">
          <Sidebar
            aria-label="Sidebar de navegación"
            className="bg-brand-azul [&>div]:bg-brand-azul flex-1 overflow-y-auto px-3 py-2"
          >
            <SidebarItemGroup className="bg-brand-azul [&>div]:bg-brand-azul space-y-2">
              {(user.role === 1 ? adminSections : generalSections).map(
                renderSection,
              )}
            </SidebarItemGroup>
          </Sidebar>

          <div className="bg-brand-azul p-4">
            <Button
              onClick={handleLogout}
              className="w-full rounded-full bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800"
            >
              <div className="flex items-center justify-center gap-2">
                <HiOutlineLogout /> Salir
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
