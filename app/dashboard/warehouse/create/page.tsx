"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { Card, Button, FormField } from "@/app/components/ui";

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
        <div role="status" aria-label="Cargando...">
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <span className="sr-only">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Card className="w-full p-6 shadow-lg border-none bg-white dark:bg-gray-900 mt-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white text-center">Crear Depósito</h2>
        
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
            
            <div className="w-full space-y-2">
              <div className="flex items-center gap-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Centro Regional
                </label>
                <span className="text-red-600 dark:text-red-400" aria-label="Requerido">*</span>
              </div>
              <select
                id="location-selector"
                required
                onChange={handleLocationChange}
                value={form.MainLocationID || ""}
                disabled={isSubmitting}
                className="w-full rounded-lg px-4 py-2.5 text-base font-normal transition-all duration-200 ease-in-out border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-brand-azul focus-visible:outline-none dark:focus-visible:ring-blue-400 hover:border-gray-400 dark:hover:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800/50 dark:disabled:text-gray-500 dark:disabled:border-gray-700"
              >
                <option value="">Seleccione un centro...</option>
                {locations.map((loc) => (
                  <option key={loc.MainLocationID} value={loc.MainLocationID}>
                    {loc.Name} ({loc.ShortName})
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
              placeholder="Dirección del Almacén"
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
            <Button type="submit" variant="primary" className="w-full sm:w-auto px-8" isLoading={isSubmitting} disabled={!form.WarehouseCode || isSubmitting}>
              Guardar Depósito
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
