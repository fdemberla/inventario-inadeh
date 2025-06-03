"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner, Button } from "flowbite-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/DataTable"; // Make sure the path is correct

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
        const res = await fetch("/api/categories");
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
          size="xs"
          onClick={() =>
            router.push(`/dashboard/categories/edit/${row.original.CategoryID}`)
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
      <h1 className="mb-4 text-2xl font-bold text-white">
        Todas las Categorías
      </h1>
      <DataTable data={categories} columns={columns} />
    </div>
  );
}
