"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { Card, Button, FormField, Select, Spinner } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";

type MainLocation = {
  MainLocationID: number;
  Name: string;
  ShortName: string;
};

export default function EditWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<MainLocation[]>([]);
  const [form, setForm] = useState({
    WarehouseName: "",
    Location: "",
    IsActive: true,
    MainLocationID: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const toastId = toast.loading("Cargando almacén...");
      try {
        const [warehouseRes, locationsRes] = await Promise.all([
          fetch(withBasePath(`/api/warehouses/${id}`)),
          fetch(withBasePath("/api/locations")),
        ]);

        const warehouseData = await warehouseRes.json();
        const locationsData = await locationsRes.json();

        setForm({
          WarehouseName: warehouseData.warehouse?.WarehouseName || "",
          Location: warehouseData.warehouse?.Location || "",
          IsActive: warehouseData.warehouse?.IsActive ?? true,
          MainLocationID: warehouseData.warehouse?.MainLocationID || 0,
        });

        setLocations(locationsData.locations.recordset);
        toast.success("Almacén cargado", { id: toastId });
      } catch (err) {
        console.error("Error loading warehouse:", err);
        toast.error("Error al cargar los datos", { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Actualizando almacén...");
    setIsSubmitting(true);

    try {
      const res = await fetch(withBasePath(`/api/warehouses/${id}/update`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Almacén actualizado con éxito", { id: toastId });
        router.push("/dashboard/warehouse");
      } else {
        const errorText = await res.text();
        console.error("Error updating warehouse:", errorText);
        toast.error("No se pudo actualizar el almacén", { id: toastId });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Error inesperado al actualizar", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <PageLayout
      title="Editar Depósito"
      subtitle={form.WarehouseName || undefined}
      backButton={{ href: "/dashboard/warehouse", label: "Volver a depósitos" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Depósitos", href: "/dashboard/warehouse" },
        { label: "Editar" },
      ]}
    >
    <Card className="w-full">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

          <FormField label="Centro Principal" id="mainLocation" required>
            <Select
              value={form.MainLocationID}
              onChange={(e) => setForm({ ...form, MainLocationID: parseInt(e.target.value) })}
              disabled={isSubmitting}
            >
              <option value="" disabled>Seleccione un centro</option>
              {locations.map((loc) => (
                <option key={loc.MainLocationID} value={loc.MainLocationID}>
                  {loc.Name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Nombre"
            id="name"
            required
            value={form.WarehouseName}
            placeholder="Nombre del Almacén"
            onChange={(e) => setForm({ ...form, WarehouseName: e.target.value })}
            disabled={isSubmitting}
          />

          <FormField
            label="Ubicación"
            id="location"
            value={form.Location}
            placeholder="Dirección"
            onChange={(e) => setForm({ ...form, Location: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex min-h-11 items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.IsActive}
            onChange={(e) => setForm({ ...form, IsActive: e.target.checked })}
            disabled={isSubmitting}
            className="accent-brand-azul h-5 w-5 cursor-pointer"
          />
          <label htmlFor="isActive" className="text-fg cursor-pointer text-sm font-semibold">
            Activo
          </label>
        </div>

        <div className="border-line border-t pt-4 text-center">
          <Button type="submit" variant="primary" className="w-full sm:w-auto" isLoading={isSubmitting} disabled={isSubmitting}>
            Actualizar Almacén
          </Button>
        </div>
      </form>
    </Card>
    </PageLayout>
  );
}
