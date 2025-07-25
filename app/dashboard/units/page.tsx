"use client";

import { useEffect, useState } from "react";
import { Button, Spinner } from "flowbite-react";
import { DataTable } from "@/app/components/DataTable";
import { useRouter } from "next/navigation";


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
        const res = await fetch("/api/units");
        const data = await res.json();
        // ⬇️ Access the actual array inside `recordset`
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
      <div className="flex justify-center p-6">
        <Spinner size="xl" />
      </div>
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
  ];

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold dark:text-white">
        Unidades de Medida
      </h1>
              <Button
                onClick={() => router.push("/dashboard/units/create")}
                className="bg-brand-verde"
              >
                Crear Unidad
              </Button>
      <>
        <DataTable data={units} columns={columns} />
      </>
    </div>
  );
}
