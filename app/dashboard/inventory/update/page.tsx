"use client";

import { useEffect, useState } from "react";
import { Label, Select, TextInput, Button } from "flowbite-react";
import { toast } from "react-hot-toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../../components/DataTable"; // adjust path as needed
import { useRouter } from "next/navigation";

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
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
    null,
  );
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [updates, setUpdates] = useState<Record<number, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      const res = await fetch("/api/warehouses/user");
      if (!res.ok) throw new Error("Error al cargar almacenes.");
      const data = await res.json();
      setWarehouses(data.recordset);
      if (data.length > 0) setSelectedWarehouseId(data[0].WarehouseID);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

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

  const fetchInventory = async (warehouseId: number) => {
    const res = await fetch(`/api/inventory/${warehouseId}`);
    const data = await res.json();
    setInventory(data);
    setLastUpdated(new Date());
  };

  const handleUpdate = async (item: InventoryItem) => {
    const newQty = updates[item.InventoryID];
    if (newQty === undefined || newQty === item.QuantityOnHand) {
      toast("Sin cambios para este producto.");
      return;
    }

    const response = await fetch("/api/inventory/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: item.ProductID,
        warehouseId: selectedWarehouseId,
        newQuantity: newQty,
        notes: "Ajuste manual",
        referenceNumber: `WEB-${new Date().toISOString().slice(0, 10)}`,
        updateType: "table",
      }),
    });

    const result = await response.json();
    if (response.ok) {
      toast.success(`Producto ${item.ProductName} actualizado.`);
      fetchInventory(selectedWarehouseId!);
    } else {
      toast.error(result.message || "Error al actualizar.");
    }
  };

  const columns: ColumnDef<InventoryItem>[] = [
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
      header: "Nueva cantidad",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <TextInput
            type="number"
            value={updates[item.InventoryID] ?? item.QuantityOnHand}
            onChange={(e) =>
              setUpdates((prev) => ({
                ...prev,
                [item.InventoryID]: Number(e.target.value),
              }))
            }
          />
        );
      },
    },
    {
      header: "Acciones",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Button size="xs" onClick={() => handleUpdate(item)}>
            Actualizar
          </Button>
        );
      },
    },
  ];

  const router = useRouter();

  return (
    <div className="space-y-6 p-6">
      <div>
        <Label htmlFor="warehouse">Almacén</Label>
        <Select
          id="warehouse"
          value={selectedWarehouseId || ""}
          onChange={(e) => setSelectedWarehouseId(e.target.value)}
        >
          <option>-- Seleccione un Deposito --</option>
          {warehouses.map((w) => (
            <option key={w.WarehouseID} value={w.WarehouseID}>
              {w.WarehouseName}
            </option>
          ))}
        </Select>
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

      <DataTable data={inventory} columns={columns} />
    </div>
  );
}
