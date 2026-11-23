"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/utils";
import { PageLayout } from "@/app/components/PageLayout";
import { Button, Card } from "@/app/components/ui";
import { AlertCircle, Warehouse as WarehouseIcon } from "lucide-react";

interface Warehouse {
  WarehouseID: number;
  WarehouseCode: string;
  Name: string;
  ShortName: string;
  WarehouseName: string;
  NombreWarehouse: string;
}

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
        return "bg-fg-muted";
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
              <div className="mb-4 h-12 w-12 rounded-full bg-surface"></div>
              <div className="mb-2 h-6 rounded bg-surface"></div>
              <div className="mb-4 h-4 rounded bg-surface"></div>
              <div className="h-4 w-24 rounded bg-surface"></div>
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
        <Card className="border-danger-fg bg-danger/10 p-6 text-center">
          <AlertCircle aria-hidden="true" className="mx-auto mb-4 h-12 w-12 text-danger-fg" />
          <h3 className="mb-2 text-xl font-bold text-danger-fg">
            Error Cargando Depósitos
          </h3>
          <p className="mb-6 text-danger-fg">{error}</p>
          <Button variant="primary" onClick={fetchWarehouses}>
            Reintentar
          </Button>
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
            className="group relative rounded-2xl border border-line bg-surface p-8 text-left shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-brand-azul/50 hover:bg-surface-muted hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-brand-azul/30"
          >
            {/* Status Indicator */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${getStatusDot("active")}`}
              ></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
                Activo
              </span>
            </div>

            {/* Icon */}
            <div className="bg-accent/10 text-accent mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105">
              <WarehouseIcon className="h-7 w-7" aria-hidden="true" />
            </div>

            {/* Content */}
            <div>
              <h3 className="mb-1.5 text-xl font-bold text-fg transition-colors group-hover:text-accent">
                {warehouse.WarehouseName}
              </h3>
              <p className="mb-3 font-mono text-sm font-medium text-brand-naranja-700 dark:text-brand-naranja">
                {warehouse.WarehouseCode}
              </p>
              <p className="mb-6 text-sm text-fg-muted">
                {warehouse.Name} ({warehouse.ShortName})
              </p>

              {/* Action Indicator */}
              <div className="flex items-center text-sm font-bold text-accent transition-colors group-hover:underline">
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
          <div className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Depósitos Disponibles
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-2 text-4xl font-extrabold text-accent drop-shadow-sm">
            {new Set(warehouses.map((w) => w.ShortName)).size}
          </div>
          <div className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Ubicaciones
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-2 text-4xl font-extrabold text-brand-naranja-700 dark:text-brand-naranja drop-shadow-sm">
            {new Set(warehouses.map((w) => w.WarehouseCode)).size}
          </div>
          <div className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Instalaciones Únicas
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
