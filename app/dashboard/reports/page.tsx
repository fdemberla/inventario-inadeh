"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/utils";
import { PageLayout } from "@/app/components/PageLayout";
import { Card } from "@/app/components/ui";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface Warehouse {
  WarehouseID: number;
  WarehouseCode: string;
  Name: string;
  ShortName: string;
  WarehouseName: string;
  NombreWarehouse: string;
}

// Icon mapping based on warehouse names/codes
const getWarehouseIcon = (warehouseName: string, warehouseCode: string) => {
  const name = warehouseName.toLowerCase();
  const code = warehouseCode.toLowerCase();

  if (name.includes("main") || name.includes("central")) return "🏢";
  if (name.includes("west") || code.includes("west")) return "🌊";
  if (name.includes("east") || code.includes("east")) return "🌅";
  if (name.includes("north") || code.includes("north")) return "🏔️";
  if (name.includes("south") || code.includes("south")) return "🌴";
  if (name.includes("distribution")) return "📦";
  if (name.includes("hub")) return "🔄";
  return "🏪"; // default warehouse icon
};

export default function ReportsPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await fetch(withBasePath("/api/warehouses/user"));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized - Please log in");
        }
        throw new Error("Failed to fetch warehouses");
      }

      const data = await response.json();
      setWarehouses(data.recordset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseSelect = (warehouseId: number) => {
    // Navigate to warehouse-specific reports
    router.push(`/dashboard/reports/${warehouseId}`);
  };

  const getStatusDot = (status: string = "active") => {
    switch (status) {
      case "active":
        return "bg-brand-verde shadow-[0_0_8px_rgba(16,185,129,0.6)]";
      case "maintenance":
        return "bg-brand-naranja shadow-[0_0_8px_rgba(249,115,22,0.6)]";
      default:
        return "bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.6)]";
    }
  };

  // Loading state
  if (loading) {
    return (
      <PageLayout
        title="Reportes de Depósitos"
        subtitle="Cargando tus depósitos..."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Reportes" },
        ]}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse p-8">
              <div className="mb-4 h-12 w-12 rounded-full bg-white/30 dark:bg-gray-700/50"></div>
              <div className="mb-2 h-6 rounded bg-white/30 dark:bg-gray-700/50"></div>
              <div className="mb-4 h-4 rounded bg-white/30 dark:bg-gray-700/50"></div>
              <div className="h-4 w-24 rounded bg-white/30 dark:bg-gray-700/50"></div>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout
        title="Reportes de Depósitos"
        subtitle="Error al cargar la información"
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Reportes" },
        ]}
      >
        <Card className="border-red-400 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20 p-6 text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-xl font-bold text-red-700 dark:text-red-400">
            Error Cargando Depósitos
          </h3>
          <p className="mb-6 text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={fetchWarehouses}
            className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/30"
          >
            Reintentar
          </button>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Reportes de Depósitos"
      subtitle="Seleccione un almacén para ver informes y análisis detallados"
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Reportes" },
      ]}
    >
      {/* Warehouse Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((warehouse) => (
          <button
            key={warehouse.WarehouseID}
            onClick={() => handleWarehouseSelect(warehouse.WarehouseID)}
            className="group relative rounded-2xl border border-white/30 bg-white/40 p-8 text-left shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-brand-azul/50 hover:bg-white/60 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-brand-azul/30 dark:border-white/10 dark:bg-gray-900/40 dark:hover:bg-gray-800/60"
          >
            {/* Status Indicator */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${getStatusDot("active")}`}
              ></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Activo
              </span>
            </div>

            {/* Icon */}
            <div className="mb-4 text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
              {getWarehouseIcon(
                warehouse.WarehouseName,
                warehouse.WarehouseCode,
              )}
            </div>

            {/* Content */}
            <div>
              <h3 className="mb-1.5 text-xl font-bold text-gray-900 transition-colors group-hover:text-brand-azul dark:text-white dark:group-hover:text-brand-verde">
                {warehouse.WarehouseName}
              </h3>
              <p className="mb-3 font-mono text-sm font-medium text-brand-naranja">
                {warehouse.WarehouseCode}
              </p>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
                {warehouse.Name} ({warehouse.ShortName})
              </p>

              {/* Action Indicator */}
              <div className="flex items-center text-sm font-bold text-brand-azul transition-colors group-hover:text-brand-azul/80 dark:text-brand-verde dark:group-hover:text-brand-verde/80">
                <span>Ver Reportes</span>
                <svg
                  className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-2 text-4xl font-extrabold text-brand-verde drop-shadow-sm">
            {warehouses.length}
          </div>
          <div className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Depósitos Disponibles
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-2 text-4xl font-extrabold text-brand-azul drop-shadow-sm">
            {new Set(warehouses.map((w) => w.ShortName)).size}
          </div>
          <div className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Ubicaciones
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-2 text-4xl font-extrabold text-brand-naranja drop-shadow-sm">
            {new Set(warehouses.map((w) => w.WarehouseCode)).size}
          </div>
          <div className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Instalaciones Únicas
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
