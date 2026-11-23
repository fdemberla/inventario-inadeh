"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { Card, Button, FormField } from "@/app/components/ui";

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
        <div role="status" aria-label="Cargando...">
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <span className="sr-only">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full p-6 shadow-lg border-none bg-white dark:bg-gray-900 mt-6">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white text-center">Editar Almacén</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          
          <div className="w-full space-y-2">
            <div className="flex items-center gap-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Centro Principal
              </label>
              <span className="text-red-600 dark:text-red-400" aria-label="Requerido">*</span>
            </div>
            <select
              id="mainLocation"
              required
              value={form.MainLocationID}
              onChange={(e) => setForm({ ...form, MainLocationID: parseInt(e.target.value) })}
              disabled={isSubmitting}
              className="w-full rounded-lg px-4 py-2.5 text-base font-normal transition-all duration-200 ease-in-out border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-brand-azul focus-visible:outline-none dark:focus-visible:ring-blue-400 hover:border-gray-400 dark:hover:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800/50 dark:disabled:text-gray-500 dark:disabled:border-gray-700"
            >
              <option value="" disabled>Seleccione un centro</option>
              {locations.map((loc) => (
                <option key={loc.MainLocationID} value={loc.MainLocationID}>
                  {loc.Name}
                </option>
              ))}
            </select>
          </div>
          
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
        
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.IsActive}
            onChange={(e) => setForm({ ...form, IsActive: e.target.checked })}
            disabled={isSubmitting}
            className="h-5 w-5 cursor-pointer rounded border-gray-300 text-brand-azul focus:ring-brand-azul dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-brand-azul transition-all"
          />
          <label htmlFor="isActive" className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">
            Activo
          </label>
        </div>
        
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="submit" variant="primary" className="w-full sm:w-auto px-8" isLoading={isSubmitting} disabled={isSubmitting}>
            Actualizar Almacén
          </Button>
        </div>
      </form>
    </Card>
  );
}
