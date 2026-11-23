"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { PageLayout } from "@/app/components/PageLayout";
import { Card, Button, FormField, Select, Spinner, Textarea } from "@/app/components/ui";

type Category = {
  CategoryID: number;
  CategoryName: string;
};

export default function EditCategoryPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryID, setParentCategoryID] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const categoryRes = await fetch(withBasePath(`/api/categories/${id}`));
        const categoryData = await categoryRes.json();
        setCategoryName(categoryData.category.CategoryName || "");
        setDescription(categoryData.category.Description || "");
        setParentCategoryID(categoryData.category.ParentCategoryID || null);

        const categoriesRes = await fetch(withBasePath("/api/categories"));
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar la categoría.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(withBasePath(`/api/categories/${id}/update`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName,
          description,
          parentCategoryID,
        }),
      });

      if (res.ok) {
        toast.success("Categoría actualizada correctamente.");
        router.push("/dashboard/categories");
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al actualizar.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Algo salió mal.");
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
      title="Editar Categoría"
      subtitle="Actualice los datos de la categoría."
      backButton={{ href: "/dashboard/categories", label: "Volver a categorías" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Categorías", href: "/dashboard/categories" },
        { label: "Editar" },
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
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
