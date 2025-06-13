"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "flowbite-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/app/components/DataTable"; // adjust path as needed
import InventoryUpdateModal from "@/app/components/InventoryUpdateModal";
import { useParams, useRouter } from "next/navigation";

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
        // Si la pestaña está activa, iniciamos o reiniciamos el polling
        fetchInventory(selectedWarehouseId);
        interval = setInterval(() => {
          fetchInventory(selectedWarehouseId);
        }, 5000);
      } else {
        // Si la pestaña está en segundo plano, detenemos el polling
        clearInterval(interval);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Inicializamos el polling si la pestaña está activa al montar
    if (document.visibilityState === "visible") {
      fetchInventory(selectedWarehouseId);
      interval = setInterval(() => {
        fetchInventory(selectedWarehouseId);
      }, 5000);
    }

    // Cleanup al desmontar
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedWarehouseId]);

  const fetchInventory = async (warehouseId: string) => {
    const res = await fetch(`/api/inventory/${warehouseId}`);
    const data = await res.json();
    setInventory(data);
    setLastUpdated(new Date());
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
              size="xs"
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
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/inventory`)}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg
            className="mr-1 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>
      </div>
      {selectedWarehouseId && (
        <Button
          onClick={() =>
            router.push(`/dashboard/inventory/${selectedWarehouseId}/add`)
          }
        >
          Agregar Producto a Deposito
        </Button>
      )}
      <div>
        {lastUpdated && (
          <p className="text-sm text-gray-500">
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <InventoryUpdateModal
        item={modalItem}
        warehouseId={selectedWarehouseId}
        onClose={() => setModalItem(null)}
        onSuccess={() => fetchInventory(selectedWarehouseId)}
      />

      <DataTable data={inventory} columns={columns} />
    </div>
  );
}
