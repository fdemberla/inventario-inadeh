"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
import { DataTable } from "../../components/DataTable";
import { withBasePath } from "@/lib/utils";

type Warehouse = {
  WarehouseID: number;
  WarehouseCode: string;
  WarehouseName: string;
  Location?: string;
  IsActive: boolean;
};

export default function WarehouseListPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(withBasePath("/api/warehouses"))
      .then((res) => res.json())
      .then((data) => setWarehouses(data.warehouses.recordset))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { accessorKey: "WarehouseCode", header: "Código" },
    { accessorKey: "Address", header: "Provincia" },
    { accessorKey: "WarehouseName", header: "Nombre" },
    { accessorKey: "Name", header: "Centro" },
    { accessorKey: "Location", header: "Ubicación" },
    {
      accessorKey: "IsActive",
      header: "Activo",
      cell: ({ getValue }) => (getValue() ? "Sí" : "No"),
    },
    {
      header: "Acciones",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            router.push(
              withBasePath(
                `/dashboard/warehouse/${row.original.WarehouseID}/edit`,
              ),
            )
          }
        >
          Editar
        </Button>
      ),
    },
  ];

  if (loading)
    return (
      <PageLayout title="Depósitos">
        <div className="flex justify-center p-6">
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
        </div>
      </PageLayout>
    );

  return (
    <PageLayout
      title="Gestión de Depósitos"
      subtitle="Administra tus almacenes"
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Depósitos" },
      ]}
      actions={
        <Button
          variant="primary"
          onClick={() => router.push(withBasePath("/dashboard/warehouse/create"))}
        >
          Crear Depósito
        </Button>
      }
    >
      <DataTable data={warehouses} columns={columns} />
    </PageLayout>
  );
}
