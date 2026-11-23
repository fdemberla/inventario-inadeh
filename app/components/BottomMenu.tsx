"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { HiOutlineCube, HiOutlineHome } from "react-icons/hi";
import { MdLogout, MdOutlineInventory } from "react-icons/md";
import { CiBoxList } from "react-icons/ci";
import { USER_ROLES } from "@/lib/constants";
import { stripBasePath, withBasePath } from "@/lib/utils";

type User = {
  id: number;
  username: string;
  role: number;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const BottomMenu = ({ user }: { user: User }) => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems =
    user.role === USER_ROLES.ADMIN
      ? [
          {
            label: "Inicio",
            icon: HiOutlineHome,
            path: "/dashboard",
          },
          {
            label: "Productos",
            icon: HiOutlineCube,
            path: "/dashboard/products",
          },
          {
            label: "Inventario",
            icon: MdOutlineInventory,
            path: "/dashboard/inventory",
          },
          {
            label: "Unidades",
            icon: CiBoxList,
            path: "/dashboard/units",
          },
        ]
      : [
          {
            label: "Inicio",
            icon: HiOutlineHome,
            path: "/dashboard",
          },
          {
            label: "Productos",
            icon: HiOutlineCube,
            path: "/dashboard/products",
          },
          {
            label: "Inventario",
            icon: MdOutlineInventory,
            path: "/dashboard/inventory",
          },
        ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: withBasePath("/login") });
  };

  return (
    <nav role="navigation" aria-label="Menú de navegación" className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-gray-200/50 bg-white/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] md:hidden dark:border-gray-800/50 dark:bg-gray-900/80">
      {menuItems.map((item) => {
        const normalizedPathname = stripBasePath(pathname);
        const isActive = normalizedPathname === item.path || (item.path !== '/dashboard' && normalizedPathname.startsWith(item.path));
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            aria-label={`Ir a ${item.label}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center px-2 py-1 text-[10px] font-medium transition-all duration-200 ${
              isActive
                ? "text-brand-azul scale-110 dark:text-brand-azul"
                : "text-gray-500 hover:text-brand-azul hover:bg-gray-100/50 rounded-lg dark:text-gray-400 dark:hover:bg-gray-800/50"
            }`}
          >
            <item.icon className={`mb-1 h-6 w-6 ${isActive ? 'stroke-2' : ''}`} />
            {item.label}
          </button>
        );
      })}
      <button
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        className={`flex flex-col items-center justify-center px-2 py-1 text-[10px] font-medium text-gray-500 transition-all duration-200 hover:bg-red-50/50 hover:text-red-600 rounded-lg dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400`}
      >
        <MdLogout className="mb-1 h-6 w-6" />
        Salir
      </button>
    </nav>
  );
};

export default BottomMenu;
