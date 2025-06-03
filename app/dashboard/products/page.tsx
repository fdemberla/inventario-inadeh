"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner, Button } from "flowbite-react";
import { DataTable } from "../../components/DataTable";

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
        const res = await fetch("/api/products");
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
          size="xs"
          onClick={() =>
            router.push(`/dashboard/products/edit/${row.original.ProductID}`)
          }
        >
          Editar
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-6 align-middle">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">
          Todos los Productos
        </h1>
        <Button
          onClick={() => router.push("/dashboard/products/create")}
          className="bg-brand-verde"
        >
          Crear Producto
        </Button>
      </div>
      <DataTable data={products} columns={columns} />
    </div>
  );
}
