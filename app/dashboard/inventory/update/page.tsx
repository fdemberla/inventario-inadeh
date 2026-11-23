"use client";

import { useEffect, useState, useMemo } from "react";
import { Button, Card } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
import { toast } from "react-hot-toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/app/components/DataTable";
import { useRouter } from "next/navigation";
import InventoryUpdateModal from "@/app/components/InventoryUpdateModal";
import { withBasePath } from "@/lib/utils";

type Warehouse = {
  WarehouseID: number;
  WarehouseName: string;
  WarehouseCode: string;
};

type InventoryItem = {
  InventoryID: number;
  ProductID: number;
  ProductName: string;
  QuantityOnHand: number;
};

export default function InventoryPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [modalItem, setModalItem] = useState<InventoryItem | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId !== null) {
      fetchInventory(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(withBasePath("/api/warehouses/user"));
      if (!res.ok) throw new Error("Error al cargar almacenes.");
      const data = await res.json();
      setWarehouses(data.recordset);
      if (data.recordset.length > 0) setSelectedWarehouseId(data.recordset[0].WarehouseID.toString());
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  useEffect(() => {
    if (!selectedWarehouseId) return;

    let interval: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchInventory(selectedWarehouseId);
        interval = setInterval(() => {
          fetchInventory(selectedWarehouseId);
        }, 5000);
      } else {
        clearInterval(interval);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (document.visibilityState === "visible") {
      fetchInventory(selectedWarehouseId);
      interval = setInterval(() => {
        fetchInventory(selectedWarehouseId);
      }, 5000);
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedWarehouseId]);

  const fetchInventory = async (warehouseId: string | number) => {
    try {
      const res = await fetch(withBasePath(`/api/inventory/${warehouseId}`));
      if(res.ok) {
        const data = await res.json();
        setInventory(data);
        setLastUpdated(new Date());
      }
    } catch(err) {
      console.error(err);
    }
  };

  const columns: ColumnDef<InventoryItem>[] = useMemo(
    () => [
      {
        header: "Código de barras",
        accessorKey: "Barcode",
      },
      {
        header: "Producto",
        accessorKey: "ProductName",
      },
      {
        header: "Cantidad actual",
        accessorKey: "QuantityOnHand",
      },
      {
        header: "Unidad",
        accessorKey: "UnitName",
      },
      {
        header: "Acciones",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setModalItem(item);
              }}
            >
              Actualizar
            </Button>
          );
        },
      },
    ],
    [],
  );

  return (
    <PageLayout
      title="Actualizar Inventario"
      subtitle="Selecciona una bodega y gestiona el inventario general."
      backButton={{ href: "/dashboard/inventory", label: "Volver a Inventario" }}
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Inventario", href: withBasePath("/dashboard/inventory") },
        { label: "Actualizar" },
      ]}
      actionButton={
        selectedWarehouseId ? {
          label: "Agregar Producto",
          onClick: () => router.push(`/dashboard/inventory/${selectedWarehouseId}/add`),
        } : undefined
      }
    >
      <div className="space-y-6">
        {/* Selector de Bodega */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-1/3">
            <label htmlFor="warehouse" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Seleccione Almacén
            </label>
            <div className="relative">
              <select
                id="warehouse"
                value={selectedWarehouseId || ""}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-azul focus:ring-brand-azul shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-sm dark:border-gray-600/60 dark:bg-gray-800/50 dark:text-white dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] transition-all"
              >
                <option value="">-- Seleccione un Deposito --</option>
                {warehouses.map((w) => (
                  <option key={w.WarehouseID} value={w.WarehouseID}>
                    {w.WarehouseName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pb-2">
            {lastUpdated && (
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Última actualización: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <InventoryUpdateModal
          item={modalItem}
          warehouseId={selectedWarehouseId}
          onClose={() => setModalItem(null)}
          onSuccess={() => fetchInventory(Number(selectedWarehouseId))}
        />

        {selectedWarehouseId ? (
          <Card noPadding className="overflow-hidden mt-4">
            <DataTable data={inventory} columns={columns} />
          </Card>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/30 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/30">
            <p className="text-gray-500 dark:text-gray-400">
              Seleccione una bodega para ver su inventario
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
