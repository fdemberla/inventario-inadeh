"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { PageLayout } from "@/app/components/PageLayout";
import { Card, Button, FormField, Select, Textarea } from "@/app/components/ui";

type Category = {
  CategoryID: number;
  CategoryName: string;
};

export default function CreateCategoryPage() {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryID, setParentCategoryID] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch(withBasePath("/api/categories"));
      const data = await res.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(withBasePath("/api/categories/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName, description, parentCategoryID }),
      });

      if (res.ok) {
        toast.success("Categoría creada exitosamente.");

        // Reset form
        setCategoryName("");
        setDescription("");
        setParentCategoryID(null);

        // Refresh categories
        const refreshRes = await fetch(withBasePath("/api/categories"));
        const refreshData = await refreshRes.json();
        setCategories(refreshData);
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al crear la categoría.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Crear Categoría"
      subtitle="Complete los datos para registrar una nueva categoría."
      backButton={{ href: "/dashboard/categories", label: "Volver a categorías" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Categorías", href: "/dashboard/categories" },
        { label: "Crear" },
      ]}
    >
      <Card className="w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Nombre de Categoría"
              id="categoryName"
              name="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ej. Herramientas"
              required
            />

            <FormField label="Categoría Principal (Opcional)" id="parentCategory">
              <Select
                value={parentCategoryID ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setParentCategoryID(value ? parseInt(value) : null);
                }}
              >
                <option value="">Ninguna (Nivel Superior)</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryID}>
                    {cat.CategoryName}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Descripción (Opcional)" id="description">
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escriba una descripción detallada"
            />
          </FormField>

          <div className="border-line border-t pt-4 text-center">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Crear Categoría
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
