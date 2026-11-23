"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/app/components/DataTable";
import InventoryUpdateModal from "@/app/components/InventoryUpdateModal";
import { useParams, useRouter } from "next/navigation";
import { withBasePath } from "@/lib/utils";

type InventoryItem = {
  InventoryID: number;
  ProductID: number;
  ProductName: string;
  QuantityOnHand: number;
};

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [modalItem, setModalItem] = useState<InventoryItem | null>(null);
  const [showZero, setShowZero] = useState(false);

  const selectedWarehouseId = params?.id as string;

  useEffect(() => {
    if (selectedWarehouseId !== null) {
      fetchInventory(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

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

  const fetchInventory = async (warehouseId: string) => {
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
      title="Inventario de Bodega"
      subtitle="Consulta y actualiza los niveles de existencia actuales."
      backButton={{ href: "/dashboard/inventory", label: "Volver al listado" }}
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Inventario", href: withBasePath("/dashboard/inventory") },
        { label: "Vista" },
      ]}
      actions={
        <Button
          variant="primary"
          onClick={() => router.push(`/dashboard/inventory/${selectedWarehouseId}/add`)}
        >
          Agregar Producto
        </Button>
      }
    >
      <div className="space-y-6">
        {lastUpdated && (
          <p className="text-fg-muted text-sm">
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        <InventoryUpdateModal
          item={modalItem}
          warehouseId={selectedWarehouseId}
          onClose={() => setModalItem(null)}
          onSuccess={() => fetchInventory(selectedWarehouseId)}
        />

        <DataTable
          caption="Inventario de la bodega"
          data={showZero ? inventory : inventory.filter((item) => item.QuantityOnHand > 0)}
          columns={columns}
          emptyMessage={
            showZero ? "No hay productos en esta bodega." : "No hay productos con stock."
          }
          toolbar={
            <label className="text-fg flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showZero}
                onChange={(e) => setShowZero(e.target.checked)}
                className="accent-brand-azul h-5 w-5 cursor-pointer"
              />
              Ver productos sin stock
            </label>
          }
        />
      </div>
    </PageLayout>
  );
}
