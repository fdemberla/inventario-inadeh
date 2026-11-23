"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ScanBarcode } from "lucide-react";
import { PageLayout } from "@/app/components/PageLayout";
import { Button, Spinner } from "@/app/components/ui";
import { withBasePath } from "@/lib/utils";

type Warehouse = {
  WarehouseID: number;
  WarehouseName: string;
  WarehouseCode: string;
};

export default function InventoryPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(withBasePath("/api/warehouses/user"));
      if (!res.ok) throw new Error("Error al cargar almacenes.");
      const data = await res.json();
      setWarehouses(data.recordset);
      if (data.recordset.length > 0) {
        setSelectedWarehouseId(data.recordset[0].WarehouseID.toString());
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();

  if (loading) {
    return (
      <PageLayout title="Gestión de Inventario">
        <div className="flex min-h-96 items-center justify-center">
          <div role="status" aria-label="Cargando almacenes..." className="text-center">
            <Spinner size="xl" color="primary" className="mx-auto" />
            <p className="mt-4 text-fg-muted" aria-hidden="true">
              Cargando almacenes...
            </p>
            <span className="sr-only">Cargando almacenes...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Gestión de Inventario"
      subtitle="Selecciona un depósito para continuar"
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Inventario" },
      ]}
    >
      {/* Warehouse Selection Cards */}
      <div className="mb-6 space-y-3">
        {warehouses.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-6 text-center">
            <div className="mb-2 text-fg-muted">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <p className="text-fg-muted">
              No hay depósitos disponibles
            </p>
          </div>
        ) : (
          warehouses.map((warehouse) => (
            <button
              key={warehouse.WarehouseID}
              onClick={() =>
                setSelectedWarehouseId(warehouse.WarehouseID.toString())
              }
              aria-pressed={selectedWarehouseId === warehouse.WarehouseID.toString()}
              className={`focus-visible:outline-focus w-full rounded-2xl border-2 p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99] ${
                selectedWarehouseId === warehouse.WarehouseID.toString()
                  ? "border-accent bg-accent/5"
                  : "border-line bg-surface hover:bg-surface-muted shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-4">
                    {/* Warehouse Icon */}
                    <div
                      className={`flex-shrink-0 rounded-xl p-3 ${
                        selectedWarehouseId === warehouse.WarehouseID.toString()
                          ? "bg-surface text-accent shadow-sm"
                          : "bg-surface-muted text-fg-muted"
                      }`}
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>

                    {/* Warehouse Info */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate font-semibold text-lg ${
                          selectedWarehouseId ===
                          warehouse.WarehouseID.toString()
                            ? "text-accent"
                            : "text-fg"
                        } `}
                      >
                        {warehouse.WarehouseName}
                      </h3>
                      <p
                        className={`truncate text-sm mt-0.5 font-medium ${
                          selectedWarehouseId ===
                          warehouse.WarehouseID.toString()
                            ? "text-accent"
                            : "text-fg-muted"
                        } `}
                      >
                        Código: {warehouse.WarehouseCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                <div className="ml-4 flex-shrink-0">
                  {selectedWarehouseId === warehouse.WarehouseID.toString() ? (
                    <div className="bg-accent flex h-6 w-6 items-center justify-center rounded-full">
                      <svg
                        aria-hidden="true"
                        className="text-surface h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div aria-hidden="true" className="border-line-strong bg-surface h-6 w-6 rounded-full border-2"></div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Action Buttons */}
      {selectedWarehouseId && (
        <div className="space-y-3">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() =>
              router.push(`/dashboard/inventory/${selectedWarehouseId}/add`)
            }
            leftIcon={
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            }
          >
            Agregar Producto a Depósito
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                router.push(`/dashboard/inventory/${selectedWarehouseId}/view`)
              }
              leftIcon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              }
            >
              Ver Inventario
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() =>
                router.push(`/dashboard/reports/${selectedWarehouseId}`)
              }
              leftIcon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            >
              Reportes
            </Button>
          </div>

          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() =>
              router.push(
                `/dashboard/inventory/update/scanner/${selectedWarehouseId}`,
              )
            }
            leftIcon={<ScanBarcode className="h-5 w-5" aria-hidden="true" />}
          >
            Usar Scanner
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
