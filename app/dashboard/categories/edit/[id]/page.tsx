"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Label,
  TextInput,
  Textarea,
  Select,
  Button,
  Spinner,
  Card,
} from "flowbite-react";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";

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
  const [isSubmitting, setIsSubmitting] = useState(false); // ✨ New state for loading

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
    setIsSubmitting(true); // Start loading

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

        // Optionally refresh categories or navigate away
        router.push("/dashboard/categories");
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al actualizar.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Algo salió mal.");
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Editar Categoría
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="categoryName" defaultValue="Category Name" />
            <TextInput
              id="categoryName"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
            />
          </div>

          <div>
            <Label
              htmlFor="parentCategory"
              defaultValue="Parent Category (Optional)"
            />
            <Select
              id="parentCategory"
              value={parentCategoryID ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setParentCategoryID(value ? parseInt(value) : null);
              }}
            >
              <option value="">No Parent (Top Level)</option>
              {categories.map((cat) => (
                <option key={cat.CategoryID} value={cat.CategoryID}>
                  {cat.CategoryName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label
              htmlFor="description"
              defaultValue="Description (Optional)"
            />
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>

          <Button
            type="submit"
            className="flex w-full items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" /> Updating...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
