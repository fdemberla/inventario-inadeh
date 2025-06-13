"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    null,
  );

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses/user");

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
    setSelectedWarehouse(warehouseId);
    // Navigate to warehouse-specific reports
    router.push(`/dashboard/reports/${selectedWarehouse}`);
  };

  const getStatusColor = (status: string = "active") => {
    switch (status) {
      case "active":
        return "border-green-500 bg-green-50";
      case "maintenance":
        return "border-yellow-500 bg-yellow-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getStatusDot = (status: string = "active") => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "maintenance":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              Warehouse Reports
            </h1>
            <p className="text-lg text-gray-600">Cargando tus depositos...</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border-2 border-gray-200 bg-gray-100 p-8"
              >
                <div className="mb-4 h-12 w-12 rounded bg-gray-300"></div>
                <div className="mb-2 h-6 rounded bg-gray-300"></div>
                <div className="mb-4 h-4 rounded bg-gray-300"></div>
                <div className="h-4 w-24 rounded bg-gray-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              Reportes de Depositos
            </h1>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="mb-4 flex items-center">
              <div className="mr-3 text-xl text-red-600">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800">
                Error Cargando Depositos
              </h3>
            </div>
            <p className="mb-4 text-red-700">{error}</p>
            <button
              onClick={fetchWarehouses}
              className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Reportes de Depositos
          </h1>
          <p className="text-lg text-gray-600">
            Seleccione un almacén para ver informes y análisis detallados
          </p>
        </div>

        {/* Warehouse Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <button
              key={warehouse.WarehouseID}
              onClick={() => handleWarehouseSelect(warehouse.WarehouseID)}
              className={`group relative rounded-xl border-2 p-8 text-left transition-all duration-200 hover:scale-105 hover:border-blue-500 hover:shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:outline-none ${getStatusColor("active")} `}
            >
              {/* Status Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${getStatusDot("active")}`}
                ></div>
                <span className="text-sm font-medium text-gray-600 capitalize">
                  Activo
                </span>
              </div>

              {/* Icon */}
              <div className="mb-4 text-4xl transition-transform duration-200 group-hover:scale-110">
                {getWarehouseIcon(
                  warehouse.WarehouseName,
                  warehouse.WarehouseCode,
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  {warehouse.WarehouseName}
                </h3>
                <p className="mb-2 font-mono text-sm text-gray-600">
                  {warehouse.WarehouseCode}
                </p>
                <p className="mb-4 text-gray-600">
                  {warehouse.Name} ({warehouse.ShortName})
                </p>

                {/* Action Indicator */}
                <div className="flex items-center text-blue-600 transition-colors group-hover:text-blue-700">
                  <span className="text-sm font-medium">Ver Reportes</span>
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
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
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-1 text-2xl font-bold text-green-600">
              {warehouses.length}
            </div>
            <div className="text-gray-600">Depositos Disponibles</div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-1 text-2xl font-bold text-blue-600">
              {new Set(warehouses.map((w) => w.ShortName)).size}
            </div>
            <div className="text-gray-600">Ubicaciones</div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-1 text-2xl font-bold text-purple-600">
              {new Set(warehouses.map((w) => w.WarehouseCode)).size}
            </div>
            <div className="text-gray-600">Instalaciones Unicas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
