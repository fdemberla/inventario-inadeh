"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ProductForm from "@/app/components/ProductForm";
import { Button } from "@/app/components/ui";
import { withBasePath } from "@/lib/utils";

interface SupplierEntry {
  supplierID: number;
  supplierSKU: string;
  leadTimeDays: number;
  cost: number;
  isPrimarySupplier: boolean;
}

interface ProductFormData {
  productName: string;
  sku: string;
  description: string;
  barcode: string;
  categoryID: string;
  cost: string;
  unitID: string;
  unitSystem: string;
  image?: File;
  suppliers: SupplierEntry[];
}

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: ProductFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "image" && key !== "suppliers" && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    if (data.image) formData.append("image", data.image);
    formData.append("suppliers", JSON.stringify(data.suppliers));

    const res = await fetch(withBasePath("/api/products/create"), {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (res.ok) {
      toast.success("Producto creado exitosamente.");

      toast.custom((t) => (
        <div className="max-w-sm rounded-lg border border-line bg-surface p-4 shadow-lg">
          <p className="mb-2 text-sm font-medium text-fg">
            ¿Desea agregar otro producto?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                toast.dismiss(t.id);
                router.refresh();
              }}
            >
              Agregar otro
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                toast.dismiss(t.id);
                router.push("/dashboard/products");
              }}
            >
              Ver productos
            </Button>
          </div>
        </div>
      ));
    } else {
      toast.error(result.message || "Error al crear el producto.");
    }
  };

  return (
    <ProductForm
      onSubmit={handleSubmit}
      formTitle="Nuevo Producto"
      submitButtonText="Crear producto"
      showIstmoSearch={true}
    />
  );
}
