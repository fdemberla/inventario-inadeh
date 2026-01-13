"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Spinner, Alert } from "flowbite-react";
import { HiRefresh } from "react-icons/hi";
import WarehouseCard from "../components/WarehouseCard";

interface Warehouse {
  WarehouseID: number;
  WarehouseCode: string;
  WarehouseName: string;
  Name: string;
  ShortName?: string;
  NombreWarehouse?: string;
}

interface InventoryItem {
  InventoryID: number;
  ProductID: number;
  WarehouseID: number;
  QuantityOnHand: number;
  QuantityReserved: number;
  ReorderLevel?: number;
  ProductName: string;
  Barcode: string;
  UnitName: string;
}

interface CategoryInventory {
  categoryName: string;
  quantity: number;
}

interface WarehouseInventory {
  warehouseId: number;
  categories: CategoryInventory[];
  isCached: boolean;
}

export default function Dashboard() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseInventory, setWarehouseInventory] = useState<
    Map<number, WarehouseInventory>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch warehouses accessible to user
  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch("/api/warehouses/user");
      if (!res.ok) throw new Error("Failed to fetch warehouses");
      const data = await res.json();
      setWarehouses(data.recordset || data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar almacenes"
      );
    }
  }, []);

  // Fetch inventory for a specific warehouse and group by category
  const fetchWarehouseInventory = useCallback(
    async (warehouseId: number, isCached: boolean = false) => {
      try {
        const res = await fetch(`/api/inventory/${warehouseId}`);
        if (!res.ok) throw new Error("Failed to fetch inventory");
        const data: InventoryItem[] = await res.json();

        // Group by category name and sum quantities
        const categoryMap = new Map<string, number>();
        data.forEach((item) => {
          const categoryName = item.ProductName || "Sin categoría";
          // Try to extract category from product name or use a fallback
          const quantity = item.QuantityOnHand || 0;
          categoryMap.set(
            categoryName,
            (categoryMap.get(categoryName) || 0) + quantity
          );
        });

        // Convert to sorted array (descending by quantity)
        const categories: CategoryInventory[] = Array.from(
          categoryMap.entries()
        )
          .map(([name, quantity]) => ({
            categoryName: name,
            quantity,
          }))
          .sort((a, b) => b.quantity - a.quantity);

        setWarehouseInventory((prev) => {
          const newMap = new Map(prev);
          newMap.set(warehouseId, {
            warehouseId,
            categories,
            isCached,
          });
          return newMap;
        });
      } catch (err) {
        console.error(`Error fetching inventory for warehouse ${warehouseId}:`, err);
      }
    },
    []
  );

  // Load all data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchWarehouses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar datos"
      );
    } finally {
      setLoading(false);
    }
  }, [fetchWarehouses]);

  // Fetch inventory for all warehouses
  const fetchAllInventories = useCallback(async () => {
    if (warehouses.length === 0) return;

    for (const warehouse of warehouses) {
      await fetchWarehouseInventory(warehouse.WarehouseID, false);
    }
    setLastUpdate(new Date());
  }, [warehouses, fetchWarehouseInventory]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Fetch inventory once warehouses are loaded
  useEffect(() => {
    if (warehouses.length > 0 && warehouseInventory.size === 0) {
      fetchAllInventories();
    }
  }, [warehouses, warehouseInventory.size, fetchAllInventories]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      fetchAllInventories();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllInventories]);

  // Manual refresh
  const handleRefresh = async () => {
    setLastUpdate(new Date());
    await fetchAllInventories();
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return "Nunca";
    return lastUpdate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="xl" />
          <p className="text-gray-600 dark:text-gray-400">
            Cargando dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Resumen de Almacenes
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Última actualización: {formatLastUpdate()}
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            onClick={handleRefresh}
            color="blue"
            size="sm"
            className="flex items-center gap-2"
          >
            <HiRefresh className="h-4 w-4" />
            Actualizar Ahora
          </Button>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Auto-actualizar cada 5 minutos
            </span>
          </label>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert color="failure" className="mb-6">
            <span className="font-medium">{error}</span>
          </Alert>
        )}

        {/* Empty State */}
        {warehouses.length === 0 && !error && (
          <Alert color="info" className="mb-6">
            <span>
              No tienes almacenes asignados. Contacta al administrador.
            </span>
          </Alert>
        )}

        {/* Warehouses Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => {
            const inventoryData = warehouseInventory.get(warehouse.WarehouseID);
            return (
              <WarehouseCard
                key={warehouse.WarehouseID}
                warehouseId={warehouse.WarehouseID}
                warehouseCode={warehouse.WarehouseCode}
                warehouseName={warehouse.WarehouseName}
                location={warehouse.Name}
                isActive={true}
                categories={inventoryData?.categories || []}
                isLoading={!inventoryData}
                isCached={inventoryData?.isCached || false}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
