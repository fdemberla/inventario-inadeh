"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Label, TextInput } from "flowbite-react";
import toast from "react-hot-toast";

export default function CreateUnitPage() {
  const router = useRouter();
  const [unitName, setUnitName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Creando unidad...");

    try {
      const res = await fetch("/api/units/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UnitName: unitName.trim(),
          Abbreviation: abbreviation.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al crear la unidad.", { id: toastId });
        return;
      }

      toast.success("Unidad creada exitosamente", { id: toastId });
      router.push("/dashboard/units");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error del servidor.", { id: toastId });
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold dark:text-white">Nueva Unidad</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="unitName">Nombre de la unidad</Label>
          <TextInput
            id="unitName"
            required
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="abbreviation">Abreviatura (opcional)</Label>
          <TextInput
            id="abbreviation"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full">
          Crear Unidad
        </Button>
      </form>
    </div>
  );
}
