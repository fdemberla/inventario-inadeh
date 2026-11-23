"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { Card, Button, FormField, Select, Spinner } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";

type RegionalLocation = {
  MainLocationID: number;
  Name: string;
  ShortName: string;
  Address: string;
};

export default function CreateWarehousePage() {
  const [locations, setLocations] = useState<RegionalLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    WarehouseName: "",
    Location: "",
    IsActive: true,
    MainLocationID: 0,
    WarehouseCode: "",
  });

  const router = useRouter();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(withBasePath("/api/locations"));
        const data = await res.json();
        setLocations(data.locations.recordset);
      } catch (err) {
        console.error("Error loading locations", err);
        toast.error("Error al cargar los centros regionales.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedID = parseInt(e.target.value);
    const selected = locations.find((loc) => loc.MainLocationID === selectedID);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        MainLocationID: selectedID,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toastId = toast.loading("Guardando Deposito...");
    setIsSubmitting(true);

    try {
      const res = await fetch(withBasePath("/api/warehouses/create"), {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Almacén creado con éxito", { id: toastId });
        router.push("/dashboard/warehouse");
      } else {
        const errorText = await res.text();
        console.error("Error creating warehouse:", errorText);
        toast.error("Error al crear el Deposito", { id: toastId });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Error inesperado", { id: toastId });
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
      title="Crear Depósito"
      subtitle="Complete los datos para registrar un nuevo depósito."
      backButton={{ href: "/dashboard/warehouse", label: "Volver a depósitos" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Depósitos", href: "/dashboard/warehouse" },
        { label: "Crear" },
      ]}
    >
      <Card className="w-full">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label="Código de Depósito"
              id="warehouseCode"
              value={form.WarehouseCode}
              placeholder="Código Interno del Deposito"
              onChange={(e) => setForm({ ...form, WarehouseCode: e.target.value })}
              disabled={isSubmitting}
            />

            <FormField label="Centro Regional" id="location-selector" required>
              <Select
                onChange={handleLocationChange}
                value={form.MainLocationID || ""}
                disabled={isSubmitting}
              >
                <option value="">Seleccione un centro...</option>
                {locations.map((loc) => (
                  <option key={loc.MainLocationID} value={loc.MainLocationID}>
                    {loc.Name} ({loc.ShortName})
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
              placeholder="Dirección del Almacén"
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
            <Button type="submit" variant="primary" className="w-full sm:w-auto" isLoading={isSubmitting} disabled={!form.WarehouseCode || isSubmitting}>
              Guardar Depósito
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
