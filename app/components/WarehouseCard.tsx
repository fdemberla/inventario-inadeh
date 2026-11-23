"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Badge, Card, Spinner, buttonVariants } from "@/app/components/ui";
import { cn } from "@/lib/utils";

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

function CategoryList({ items }: { items: CategoryInventory[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((category, idx) => (
        <li key={`${category.categoryName}-${idx}`} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-fg-muted min-w-0 truncate">{category.categoryName}</span>
          <span className="bg-accent/10 text-accent shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
            {category.quantity}
          </span>
        </li>
      ))}
    </ul>
  );
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
  const moreId = useId();

  const topCategories = categories.slice(0, 5);
  const remainingCategories = categories.slice(5);
  const totalInventory = categories.reduce((sum, cat) => sum + cat.quantity, 0);

  if (isLoading) {
    return (
      <Card className="flex h-full min-h-[250px] items-center justify-center">
        <div role="status" className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-fg-muted font-medium">Cargando inventario...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-fg text-xl font-bold">{warehouseCode}</h3>
          <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Activo" : "Inactivo"}</Badge>
          {isCached && <Badge tone="warning">Datos sin conexión</Badge>}
        </div>
        <p className="text-fg-muted mb-1 text-sm font-medium">{warehouseName}</p>
        <p className="text-fg-muted text-xs">{location}</p>
      </div>

      <div className="border-line bg-surface-muted mb-5 flex-1 rounded-xl border p-4">
        <p className="border-line text-fg mb-4 border-b pb-2 text-sm font-semibold">
          Inventario total:{" "}
          <span className="text-accent ml-1 text-lg tabular-nums">{totalInventory}</span> unidades
        </p>

        {topCategories.length > 0 ? (
          <CategoryList items={topCategories} />
        ) : (
          <p className="text-fg-muted text-sm italic">Sin inventario registrado</p>
        )}

        {remainingCategories.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls={moreId}
              className="text-accent hover:bg-accent/10 focus-visible:outline-focus -ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold focus-visible:outline-2"
            >
              {expanded ? "Ver menos" : `Ver ${remainingCategories.length} categorías más`}
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            {expanded && (
              <div id={moreId} className="border-line mt-2 border-t pt-3">
                <CategoryList items={remainingCategories} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* A link styled as a button (a <button> inside <a> is invalid HTML) */}
      <Link
        href={`/dashboard/inventory?warehouseId=${warehouseId}`}
        className={cn(buttonVariants({ variant: "primary", size: "md" }), "mt-auto w-full")}
      >
        Ver detalle
        <span className="sr-only"> de {warehouseCode}</span>
      </Link>
    </Card>
  );
}
