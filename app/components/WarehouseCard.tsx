"use client";

import { Card, Button, Badge, Spinner } from "flowbite-react";
import { useState } from "react";
import Link from "next/link";

interface CategoryInventory {
  categoryName: string;
  quantity: number;
}

interface WarehouseCardProps {
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  location: string;
  isActive: boolean;
  categories: CategoryInventory[];
  isLoading?: boolean;
  isCached?: boolean;
}

export default function WarehouseCard({
  warehouseId,
  warehouseCode,
  warehouseName,
  location,
  isActive,
  categories,
  isLoading = false,
  isCached = false,
}: WarehouseCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const topCategories = categories.slice(0, 5);
  const remainingCategories = categories.slice(5);
  const totalInventory = categories.reduce((sum, cat) => sum + cat.quantity, 0);

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[250px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400">Cargando inventario...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {warehouseCode}
            </h3>
            <Badge
              color={isActive ? "success" : "gray"}
              size="sm"
            >
              {isActive ? "Activo" : "Inactivo"}
            </Badge>
            {isCached && (
              <Badge color="yellow" size="sm">
                Cacheado
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {warehouseName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {location}
          </p>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Inventario Total: <span className="text-lg text-blue-600 dark:text-blue-400">{totalInventory}</span> unidades
        </div>

        {/* Top 5 Categories */}
        <div className="space-y-2">
          {topCategories.length > 0 ? (
            topCategories.map((category, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {category.categoryName}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {category.quantity}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Sin inventario registrado
            </p>
          )}
        </div>

        {/* Expandable remaining categories */}
        {remainingCategories.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {expanded
                ? "Ver menos"
                : `Ver ${remainingCategories.length} más categorías`}
            </button>

            {expanded && (
              <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {remainingCategories.map((category, idx) => (
                  <div key={idx + 5} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {category.categoryName}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {category.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/dashboard/inventory?warehouseId=${warehouseId}`}
          className="flex-1"
        >
          <Button
            size="sm"
            color="blue"
            className="w-full"
          >
            Ver Detalle
          </Button>
        </Link>
      </div>
    </Card>
  );
}
