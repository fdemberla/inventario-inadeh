"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextInput,
  Label,
  Button,
  Checkbox,
  Select,
  Spinner,
} from "flowbite-react";
import toast, { Toaster } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";

type RegionalLocation = {
  MainLocationID: number;
  Name: string;
  ShortName: string;
  Address: string;
};

export default function CreateWarehousePage() {
  const [locations, setLocations] = useState<RegionalLocation[]>([]);
  const [loading, setLoading] = useState(true);
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
      // const timestamp = Date.now().toString().slice(-5); // unique suffix
      // const code = `${selected.ShortName}-${timestamp}`;
      setForm((prev) => ({
        ...prev,
        MainLocationID: selectedID,
        // WarehouseCode: code,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toastId = toast.loading("Guardando Deposito...");
    try {
      const res = await fetch(withBasePath("/api/warehouses/create"), {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Almacén creado con éxito", { id: toastId });
        router.push(withBasePath("/dashboard/warehouse"));
      } else {
        const errorText = await res.text();
        console.error("Error creating warehouse:", errorText);
        toast.error("Error al crear el Deposito", { id: toastId });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Error inesperado", { id: toastId });
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
      <Toaster position="top-right" />
      <form
        onSubmit={handleSubmit}
        className="max-w-md space-y-4 p-6 text-white"
      >
        <h1 className="text-2xl font-bold">Crear Deposito</h1>

        <div>
          <Label>Código de Deposito</Label>
          <TextInput
            value={form.WarehouseCode}
            placeholder="Código Interno del Deposito"
            onChange={(e) =>
              setForm({ ...form, WarehouseCode: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="location-selector">
            ¿En qué centro está el Deposito?
          </Label>
          <Select
            id="location-selector"
            required
            onChange={handleLocationChange}
            value={form.MainLocationID || ""}
          >
            <option value="">Seleccione un centro...</option>
            {locations.map((loc) => (
              <option key={loc.MainLocationID} value={loc.MainLocationID}>
                {loc.Name} ({loc.ShortName})
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
            placeholder="Dirección del Almacén"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.IsActive}
            onChange={(e) => setForm({ ...form, IsActive: e.target.checked })}
          />
          <Label>Activo</Label>
        </div>

        <Button type="submit" disabled={!form.WarehouseCode}>
          Guardar
        </Button>
      </form>
    </>
  );
}
