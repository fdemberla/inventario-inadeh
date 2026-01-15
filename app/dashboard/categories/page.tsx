"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/DataTable";
import { withBasePath } from "@/lib/utils";

type Category = {
  CategoryID: number;
  CategoryName: string;
};

export default function ViewAllCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(withBasePath("/api/categories"));
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "CategoryName",
      header: "Nombre de Categoría",
      cell: (info) => info.getValue(),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            router.push(
              withBasePath(
                `/dashboard/categories/edit/${row.original.CategoryID}`,
              ),
            )
          }
        >
          Editar
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <PageLayout title="Categorías">
        <div className="flex justify-center p-6">
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Todas las Categorías"
      subtitle="Administra las categorías de productos"
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Categorías" },
      ]}
      actions={
        <Button
          variant="primary"
          onClick={() =>
            router.push(withBasePath("/dashboard/categories/create"))
          }
        >
          Crear Categoría
        </Button>
      }
    >
      <DataTable data={categories} columns={columns} />
    </PageLayout>
  );
}
