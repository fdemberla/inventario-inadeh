"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";
import { DataTable } from "@/app/components/DataTable";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/utils";

type Unit = {
  UnitID: number;
  UnitName: string;
  Abbreviation: string | null;
  System: string;
};

export default function ViewAllUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch(withBasePath("/api/units"));
        const data = await res.json();
        setUnits(data);
      } catch (error) {
        console.error("Error fetching units:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  if (loading) {
    return (
      <PageLayout title="Unidades">
        <div className="flex justify-center p-6">
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-line"></div>
        </div>
      </PageLayout>
    );
  }

  const columns = [
    {
      header: "Nombre",
      accessorKey: "UnitName",
    },
    {
      header: "Abreviatura",
      accessorKey: "Abbreviation",
    },
    {
      header: "Sistema",
      accessorKey: "System",
    },
    {
      header: "Acciones",
      id: "actions",
      // Only custom units are editable (the API enforces it too)
      cell: ({ row }) =>
        row.original.System === "Personalizado" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              router.push(`/dashboard/units/${row.original.UnitID}/edit`)
            }
          >
            Editar
          </Button>
        ) : null,
    },
  ];

  return (
    <PageLayout
      title="Unidades de Medida"
      subtitle="Administra las unidades de medida"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Unidades" },
      ]}
      actions={
        <Button
          variant="primary"
          onClick={() => router.push("/dashboard/units/create")}
        >
          Crear Unidad
        </Button>
      }
    >
      <DataTable caption="Unidades de medida" data={units} columns={columns} />
    </PageLayout>
  );
}
