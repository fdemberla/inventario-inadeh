"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import UnitForm from "@/app/components/UnitForm";
import { PageLayout } from "@/app/components/PageLayout";
import { Card } from "@/app/components/ui";
import { withBasePath } from "@/lib/utils";

interface Unit {
  UnitID: number;
  UnitName: string;
  Abbreviation: string | null;
  System: string;
}

export default function EditUnitPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(withBasePath(`/api/units/${id}`));
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudo cargar la unidad.");
        setUnit(data);
      } catch (err) {
        setError((err as Error).message);
        toast.error((err as Error).message);
      }
    };
    load();
  }, [id]);

  const isEditable = unit?.System === "Personalizado";

  return (
    <PageLayout
      title="Editar Unidad"
      subtitle={unit ? unit.UnitName : undefined}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Unidades", href: "/dashboard/units" },
        { label: "Editar" },
      ]}
    >
      <Card className="mx-auto w-full max-w-xl">
        {error ? (
          <p role="alert" className="text-red-700 dark:text-red-400">
            {error}
          </p>
        ) : !unit ? (
          <p role="status">Cargando…</p>
        ) : !isEditable ? (
          <p role="alert" className="text-gray-700 dark:text-gray-300">
            Las unidades del sistema {unit.System} no se pueden editar. Solo
            las unidades personalizadas son editables.
          </p>
        ) : (
          <UnitForm
            title=""
            initialValues={{
              unitName: unit.UnitName,
              abbreviation: unit.Abbreviation ?? "",
            }}
            apiEndpoint={`/api/units/${unit.UnitID}/update`}
            httpMethod="PUT"
            submitButtonText="Guardar cambios"
            loadingMessage="Guardando unidad..."
            successMessage="Unidad actualizada"
            onCancel={() => router.push("/dashboard/units")}
            onSuccess={() => router.push("/dashboard/units")}
          />
        )}
      </Card>
    </PageLayout>
  );
}
