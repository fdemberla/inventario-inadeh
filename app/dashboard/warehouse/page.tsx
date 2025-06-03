"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "flowbite-react";
import { DataTable } from "../../components/DataTable";

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
    fetch("/api/warehouses")
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
          size="xs"
          onClick={() =>
            router.push(`/dashboard/warehouse/${row.original.WarehouseID}/edit`)
          }
        >
          Editar
        </Button>
      ),
    },
  ];

  if (loading)
    return (
      <div className="flex justify-center p-6">
        <Spinner size="xl" />
      </div>
    );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Depositos</h1>
        <Button onClick={() => router.push("/dashboard/warehouse/create")}>
          Crear Deposito
        </Button>
      </div>
      <DataTable data={warehouses} columns={columns} />
    </div>
  );
}
