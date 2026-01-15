"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
import { DataTable } from "../../components/DataTable";
import { withBasePath } from "@/lib/utils";

type Product = {
  ProductID: number;
  ProductName: string;
  InternalSKU: string;
  Barcode: string;
  CategoryName?: string;
};

export default function ViewAllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(withBasePath("/api/products"));
        const data = await res.json();
        setProducts(data.products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const columns = [
    {
      header: "Nombre",
      accessorKey: "ProductName",
    },
    {
      header: "SKU",
      accessorKey: "InternalSKU",
    },
    {
      header: "Barcode",
      accessorKey: "Barcode",
    },
    {
      header: "Categoría",
      accessorKey: "CategoryName",
      cell: ({ getValue }: unknown) => getValue() || "N/A",
    },
    {
      header: "Acciones",
      id: "actions",
      cell: ({ row }: unknown) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            router.push(
              withBasePath(
                `/dashboard/products/edit/${row.original.ProductID}`,
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
      <PageLayout title="Productos">
        <div className="flex justify-center p-6 align-middle">
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Todos los Productos"
      subtitle="Gestiona tu catálogo de productos"
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Productos" },
      ]}
      actions={
        <Button
          variant="primary"
          onClick={() => router.push(withBasePath("/dashboard/products/create"))}
        >
          Crear Producto
        </Button>
      }
    >
      <DataTable data={products} columns={columns} />
    </PageLayout>
  );
}
