"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "flowbite-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/DataTable"; // Adjust import path if needed

type Supplier = {
  SupplierID: number;
  SupplierName: string;
  ContactPerson?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch("/api/suppliers");
        const data = await res.json();
        setSuppliers(data);
      } catch (error) {
        console.error("Error loading suppliers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "SupplierName",
      header: "Nombre",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "ContactPerson",
      header: "Contacto",
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "Phone",
      header: "Teléfono",
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "Email",
      header: "Email",
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "Address",
      header: "Dirección",
      cell: (info) => info.getValue() || "-",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="xs"
          onClick={() =>
            router.push(`/dashboard/suppliers/${row.original.SupplierID}/edit`)
          }
        >
          Editar
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Proveedores</h1>
        <Button onClick={() => router.push("/dashboard/suppliers/create")}>
          Crear Proveedor
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <p className="text-white">No hay proveedores registrados.</p>
      ) : (
        <DataTable data={suppliers} columns={columns} />
      )}
    </div>
  );
}
