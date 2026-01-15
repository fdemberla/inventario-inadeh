"use client";
import { useState } from "react";
import { Button, Label, TextInput } from "flowbite-react";
import toast from "react-hot-toast";
import { withBasePath } from "@/lib/utils";

interface UnitFormProps {
  onSuccess?: (unit: { UnitName: string; Abbreviation: string | null }) => void;
  onCancel?: () => void;
  initialValues?: {
    unitName?: string;
    abbreviation?: string;
  };
  submitButtonText?: string;
  title?: string;
  apiEndpoint?: string;
  httpMethod?: "POST" | "PUT" | "PATCH";
  loadingMessage?: string;
  successMessage?: string;
  className?: string;
}

export default function UnitForm({
  onSuccess,
  onCancel,
  initialValues = {},
  submitButtonText = "Crear Unidad",
  title = "Nueva Unidad",
  apiEndpoint = "/api/units/create",
  httpMethod = "POST",
  loadingMessage = "Creando unidad...",
  successMessage = "Unidad creada exitosamente",
  className = "mx-auto max-w-md p-6",
}: UnitFormProps) {
  const [unitName, setUnitName] = useState(initialValues.unitName || "");
  const [abbreviation, setAbbreviation] = useState(
    initialValues.abbreviation || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const toastId = toast.loading(loadingMessage);
    setIsSubmitting(true);

    try {
      const unitData = {
        UnitName: unitName.trim(),
        Abbreviation: abbreviation.trim() || null,
      };

      const res = await fetch(withBasePath(apiEndpoint), {
        method: httpMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unitData),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al procesar la unidad.", {
          id: toastId,
        });
        return;
      }

      toast.success(successMessage, { id: toastId });

      // Llamar callback de éxito si se proporciona
      if (onSuccess) {
        onSuccess(unitData);
      }

      // Limpiar formulario después del éxito
      setUnitName("");
      setAbbreviation("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error del servidor.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={className}>
      <h1 className="mb-4 text-2xl font-bold dark:text-white">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="unitName">Nombre de la unidad</Label>
          <TextInput
            id="unitName"
            required
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="abbreviation">Abreviatura (opcional)</Label>
          <TextInput
            id="abbreviation"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : submitButtonText}
          </Button>
          {onCancel && (
            <Button
              type="button"
              color="gray"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
