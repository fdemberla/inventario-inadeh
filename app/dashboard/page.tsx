// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, Button, Badge, Spinner } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  UserGroupIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  TagIcon,
  TruckIcon,
  ScaleIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: number;
  username: string;
  role: number;
  firstName?: string;
  lastName?: string;
}

interface GlobalStats {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  totalCategories: number;
}

interface ActionCard {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bgColor: string;
  href: string;
  adminOnly?: boolean;
  badge?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Actualizar información del usuario cuando cambie la sesión
  useEffect(() => {
    if (status === "loading") return; // Esperando...

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      console.log("Sesión autenticada:", session.user);
      setUser({
        id: parseInt(session.user.id || "0"),
        username: session.user.name || session.user.email || "Usuario",
        role: session.user.role || 2,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      });
    }
  }, [session, status, router]);

  // Debug: mostrar cuando el usuario se actualiza
  useEffect(() => {
    if (user) {
      console.log("Usuario actualizado:", user);
    }
  }, [user]);

  // Obtener estadísticas globales
  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await fetch("/api/stats/global", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Estadísticas cargadas:", data);
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching global stats:", error);
        setStats({
          totalProducts: 0,
          inStockProducts: 0,
          lowStockProducts: 0,
          totalCategories: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchGlobalStats();
  }, []);

  // Definir acciones basadas en roles
  const actions: ActionCard[] = [
    // Acciones para todos los usuarios
    {
      title: "Ver Inventario",
      description: "Consulta el inventario actual de productos",
      icon: ArchiveBoxIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      href: "/dashboard/inventory",
      badge: "Popular",
    },
    {
      title: "Productos",
      description: "Administra el catálogo de productos",
      icon: CubeIcon,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
      href: "/dashboard/products",
    },
    {
      title: "Reportes",
      description: "Genera reportes de inventario y estadísticas",
      icon: DocumentChartBarIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      href: "/dashboard/reports",
      badge: "Nuevo",
    },

    // Acciones solo para administradores
    {
      title: "Usuarios",
      description: "Gestiona usuarios y permisos del sistema",
      icon: UserGroupIcon,
      color: "text-red-600",
      bgColor: "bg-red-50 hover:bg-red-100",
      href: "/dashboard/users",
      adminOnly: true,
    },
    {
      title: "Depósitos",
      description: "Administra ubicaciones y almacenes",
      icon: BuildingStorefrontIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 hover:bg-indigo-100",
      href: "/dashboard/warehouse",
      adminOnly: true,
    },
    {
      title: "Categorías",
      description: "Organiza productos por categorías",
      icon: TagIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 hover:bg-yellow-100",
      href: "/dashboard/categories",
      adminOnly: true,
    },
    {
      title: "Proveedores",
      description: "Gestiona la información de proveedores",
      icon: TruckIcon,
      color: "text-teal-600",
      bgColor: "bg-teal-50 hover:bg-teal-100",
      href: "/dashboard/suppliers",
      adminOnly: true,
    },
    {
      title: "Unidades",
      description: "Define unidades de medida para productos",
      icon: ScaleIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50 hover:bg-orange-100",
      href: "/dashboard/units",
      adminOnly: true,
    },
  ];

  // Filtrar acciones según el rol del usuario
  const filteredActions = actions.filter(
    (action) => !action.adminOnly || user?.role === 1,
  );

  const isAdmin = user?.role === 1;
  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || "Usuario";

  if (status === "loading") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="xl" />
        <p className="ml-3">Cargando...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p>Redirigiendo al login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header de Bienvenida */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
              ¡Bienvenido, {userName}! 👋
            </h1>
            <p className="text-sm text-gray-600 md:text-base dark:text-gray-400">
              Plataforma de gestión de inventario INADEH
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm md:mt-0 md:flex-row md:gap-4">
            <Badge color={isAdmin ? "red" : "blue"} size="sm">
              {isAdmin ? "Administrador" : "Usuario"}
            </Badge>
            <span className="text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Acciones Rápidas
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Card
                key={action.title}
                className={`cursor-pointer border-0 transition-all duration-200 ${action.bgColor} hover:scale-105 hover:shadow-lg`}
                onClick={() => router.push(action.href)}
              >
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`rounded-lg bg-white p-2 shadow-sm`}>
                      <IconComponent className={`h-6 w-6 ${action.color}`} />
                    </div>
                    {action.badge && (
                      <Badge color="info" size="xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>

                  <h3 className="mb-2 text-sm font-semibold text-gray-900 md:text-base">
                    {action.title}
                  </h3>

                  <p className="mb-4 text-xs text-gray-600 md:text-sm">
                    {action.description}
                  </p>

                  <div className="flex justify-end">
                    <Button size="xs" color="light" className="text-xs">
                      Abrir
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Total Productos</p>
                {loadingStats ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-blue-400"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {stats?.totalProducts?.toLocaleString() || 0}
                  </p>
                )}
              </div>
              <CubeIcon className="h-8 w-8 text-blue-200" />
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">En Stock</p>
                {loadingStats ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-green-400"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {stats?.inStockProducts?.toLocaleString() || 0}
                  </p>
                )}
              </div>
              <ArchiveBoxIcon className="h-8 w-8 text-green-200" />
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-100">Bajo Stock</p>
                {loadingStats ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-yellow-400"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {stats?.lowStockProducts?.toLocaleString() || 0}
                  </p>
                )}
              </div>
              <ChartBarIcon className="h-8 w-8 text-yellow-200" />
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Categorías</p>
                {loadingStats ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-purple-400"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {stats?.totalCategories?.toLocaleString() || 0}
                  </p>
                )}
              </div>
              <TagIcon className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
