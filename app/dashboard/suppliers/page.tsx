"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/DataTable";
import { withBasePath } from "@/lib/utils";

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
        const res = await fetch(withBasePath("/api/suppliers"));
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
          size="sm"
          variant="secondary"
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
      <PageLayout title="Proveedores">
        <div className="flex justify-center p-6">
          <div role="status" aria-label="Cargando...">
            <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <span className="sr-only">Cargando...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Gestión de Proveedores"
      subtitle="Administra tus proveedores"
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Proveedores" },
      ]}
      actions={
        <Button
          variant="primary"
          onClick={() => router.push("/dashboard/suppliers/create")}
        >
          Crear Proveedor
        </Button>
      }
    >
      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-14 text-center dark:border-gray-700 dark:bg-gray-800">
          <svg className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 18L4 14m0 0l4-4M4 14h13a4 4 0 000-8H5" />
          </svg>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No hay proveedores registrados</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Crea un proveedor para comenzar</p>
        </div>
      ) : (
        <DataTable caption="Proveedores" data={suppliers} columns={columns} />
      )}
    </PageLayout>
  );
}
