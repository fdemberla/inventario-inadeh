"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  TextInput,
  Label,
  Button,
  Checkbox,
  Select,
  Spinner,
} from "flowbite-react";
import toast from "react-hot-toast";
import { withBasePath } from "@/lib/utils";

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
          WarehouseName: warehouseData.warehouse?.WarehouseName,
          Location: warehouseData.warehouse?.Location || "",
          IsActive: warehouseData.warehouse?.IsActive,
          MainLocationID: warehouseData.warehouse?.MainLocationID,
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

    try {
      const res = await fetch(withBasePath(`/api/warehouses/${id}/update`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Almacén actualizado con éxito", { id: toastId });
        router.push(withBasePath("/dashboard/warehouse"));
      } else {
        const errorText = await res.text();
        console.error("Error updating warehouse:", errorText);
        toast.error("No se pudo actualizar el almacén", { id: toastId });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Error inesperado al actualizar", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-md space-y-4 p-6 text-white"
      >
        <h1 className="text-2xl font-bold">Editar Almacén</h1>

        <div>
          <Label htmlFor="mainLocation">Centro Principal</Label>
          <Select
            id="mainLocation"
            required
            value={form.MainLocationID}
            onChange={(e) =>
              setForm({ ...form, MainLocationID: parseInt(e.target.value) })
            }
          >
            <option value="" disabled>
              Seleccione un centro
            </option>
            {locations.map((loc) => (
              <option key={loc.MainLocationID} value={loc.MainLocationID}>
                {loc.Name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="name">Nombre</Label>
          <TextInput
            id="name"
            required
            value={form.WarehouseName}
            onChange={(e) =>
              setForm({ ...form, WarehouseName: e.target.value })
            }
            placeholder="Nombre del Almacén"
          />
        </div>

        <div>
          <Label htmlFor="location">Ubicación</Label>
          <TextInput
            id="location"
            value={form.Location}
            onChange={(e) => setForm({ ...form, Location: e.target.value })}
            placeholder="Dirección"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.IsActive}
            onChange={(e) => setForm({ ...form, IsActive: e.target.checked })}
          />
          <Label>Activo</Label>
        </div>

        <Button type="submit">Actualizar</Button>
      </form>
    </>
  );
}
