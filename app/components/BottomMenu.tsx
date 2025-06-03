"use client";

import { usePathname, useRouter } from "next/navigation";
import { HiOutlineCube, HiOutlineHome } from "react-icons/hi";
import { MdLogout, MdOutlineInventory } from "react-icons/md";

const BottomMenu = ({ user }: { user: { role: number } }) => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems =
    user.role === 1
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
            path: "/dashboard/inventory/update/scanner",
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
            path: "/dashboard/inventory/update/scanner",
          },
        ];

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-gray-200 bg-white py-2 shadow md:hidden dark:border-gray-700 dark:bg-gray-900">
      {menuItems.map((item) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            aria-label={`Ir a ${item.label}`}
            className={`flex flex-col items-center justify-center text-xs transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <item.icon className="mb-1 h-6 w-6" />
            {item.label}
          </button>
        );
      })}
      <button
        onClick={handleLogout}
        className={`flex flex-col items-center justify-center text-xs text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
      >
        <MdLogout className="mb-1 h-6 w-6" />
        Salir
      </button>
    </div>
  );
};

export default BottomMenu;
