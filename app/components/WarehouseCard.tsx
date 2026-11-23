"use client";

import { Badge } from "flowbite-react";
import { Spinner } from "@/app/components/ui/Spinner";
import { useState } from "react";
import Link from "next/link";
import { Card, Button } from "@/app/components/ui";

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
          <Spinner size="lg" color="info" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Cargando inventario...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card hoverable className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {warehouseCode}
          </h3>
          <Badge color={isActive ? "success" : "gray"} size="sm" className="rounded-md">
            {isActive ? "Activo" : "Inactivo"}
          </Badge>
          {isCached && (
            <Badge color="warning" size="sm" className="rounded-md">
              Cacheado
            </Badge>
          )}
        </div>
        <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
          {warehouseName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{location}</p>
      </div>

      {/* Inventory Summary */}
      <div className="mb-5 flex-1 rounded-xl bg-white/20 p-4 dark:bg-gray-800/30 border border-white/30 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
        <div className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 pb-2 border-b border-white/20 dark:border-white/10">
          Inventario Total:{" "}
          <span className="text-lg text-brand-azul dark:text-blue-400 ml-1">
            {totalInventory}
          </span>{" "}
          unidades
        </div>

        {/* Top 5 Categories */}
        <div className="space-y-2.5">
          {topCategories.length > 0 ? (
            topCategories.map((category, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {category.categoryName}
                </span>
                <span className="font-semibold text-brand-azul dark:text-blue-300 bg-brand-azul/10 dark:bg-brand-azul/20 border border-brand-azul/20 dark:border-brand-azul/30 px-2 py-0.5 rounded-full text-xs">
                  {category.quantity}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic dark:text-gray-500">
              Sin inventario registrado
            </p>
          )}
        </div>

        {/* Expandable remaining categories */}
        {remainingCategories.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-semibold text-brand-azul hover:underline dark:text-blue-400 transition-colors"
            >
              {expanded
                ? "Ver menos"
                : `Ver ${remainingCategories.length} más categorías`}
            </button>

            {expanded && (
              <div className="mt-3 space-y-2.5 border-t border-gray-200 pt-3 dark:border-gray-700">
                {remainingCategories.map((category, idx) => (
                  <div
                    key={idx + 5}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {category.categoryName}
                    </span>
                    <span className="font-semibold text-brand-azul dark:text-blue-300 bg-brand-azul/10 dark:bg-brand-azul/20 border border-brand-azul/20 dark:border-brand-azul/30 px-2 py-0.5 rounded-full text-xs">
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
      <div className="mt-auto">
        <Link
          href={`/dashboard/inventory?warehouseId=${warehouseId}`}
          className="block w-full"
        >
          <Button variant="primary" size="md" className="w-full">
            Ver Detalle
          </Button>
        </Link>
      </div>
    </Card>
  );
}
