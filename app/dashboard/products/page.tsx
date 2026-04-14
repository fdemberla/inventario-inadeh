"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
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

  const handleDelete = (productId: number, productName: string) => {
    toast.custom(
      (t) => (
        <div className="max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <p className="mb-1 text-sm font-medium text-gray-800">
            ¿Eliminar <span className="font-semibold">{productName}</span>?
          </p>
          <p className="mb-3 text-xs text-gray-500">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const res = await fetch(
                  withBasePath(`/api/products/${productId}`),
                  {
                    method: "DELETE",
                  },
                );
                const result = await res.json();
                if (res.ok) {
                  setProducts((prev) =>
                    prev.filter((p) => p.ProductID !== productId),
                  );
                  toast.success("Producto eliminado exitosamente.");
                } else if (res.status === 409) {
                  toast.error(
                    "No se puede eliminar el producto porque tiene inventario registrado. El inventario debe ser 0 para poder eliminarlo.",
                    { duration: 6000 },
                  );
                } else {
                  toast.error(
                    result.message || "Error al eliminar el producto.",
                  );
                }
              }}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

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
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              router.push(`/dashboard/products/edit/${row.original.ProductID}`)
            }
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() =>
              handleDelete(row.original.ProductID, row.original.ProductName)
            }
          >
            Eliminar
          </Button>
        </div>
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
          onClick={() => router.push("/dashboard/products/create")}
        >
          Crear Producto
        </Button>
      }
    >
      <DataTable data={products} columns={columns} />
    </PageLayout>
  );
}
