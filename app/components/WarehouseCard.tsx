"use client";

import { Card, Button, Badge, Spinner } from "flowbite-react";
import { useState } from "react";
import Link from "next/link";
import { withBasePath } from "@/lib/utils";

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
      <Card className="flex h-full min-h-[250px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400">
            Cargando inventario...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full transition-shadow hover:shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {warehouseCode}
            </h3>
            <Badge color={isActive ? "success" : "gray"} size="sm">
              {isActive ? "Activo" : "Inactivo"}
            </Badge>
            {isCached && (
              <Badge color="yellow" size="sm">
                Cacheado
              </Badge>
            )}
          </div>
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
            {warehouseName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{location}</p>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Inventario Total:{" "}
          <span className="text-lg text-blue-600 dark:text-blue-400">
            {totalInventory}
          </span>{" "}
          unidades
        </div>

        {/* Top 5 Categories */}
        <div className="space-y-2">
          {topCategories.length > 0 ? (
            topCategories.map((category, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {category.categoryName}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {category.quantity}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic dark:text-gray-400">
              Sin inventario registrado
            </p>
          )}
        </div>

        {/* Expandable remaining categories */}
        {remainingCategories.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {expanded
                ? "Ver menos"
                : `Ver ${remainingCategories.length} más categorías`}
            </button>

            {expanded && (
              <div className="mt-3 space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
                {remainingCategories.map((category, idx) => (
                  <div
                    key={idx + 5}
                    className="flex items-center justify-between text-sm"
                  >
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
          href={withBasePath(`/dashboard/inventory?warehouseId=${warehouseId}`)}
          className="flex-1"
        >
          <Button size="sm" color="blue" className="w-full">
            Ver Detalle
          </Button>
        </Link>
      </div>
    </Card>
  );
}
