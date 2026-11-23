"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { PageLayout } from "@/app/components/PageLayout";
import { Check, Search, X } from "lucide-react";
import { Button, Input, Card, FormField, IconButton, Modal } from "@/app/components/ui";

interface ProductOption {
  ProductID: number;
  ProductName: string;
  Barcode?: string | null;
}

type FieldChange = { target: { name: string; value: string } };

interface ProductSearchSelectProps {
  products: ProductOption[];
  value: string;
  onChange: (e: FieldChange) => void;
  placeholder?: string;
  name?: string;
  // Passed by <FormField> so its label and messages point at the trigger
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
}

/** Product picker: a trigger button that opens an accessible search dialog. */
const ProductSearchSelect = ({
  products,
  value,
  onChange,
  placeholder = "Buscar producto...",
  name = "productId",
  id,
  "aria-describedby": describedBy,
}: ProductSearchSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductOption | null>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products.slice(0, 50));
    } else {
      const filtered = products
        .filter((product: ProductOption) =>
          product.ProductName.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, 20);
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  useEffect(() => {
    if (value) {
      const product = products.find(
        (p: ProductOption) => p.ProductID.toString() === value.toString(),
      );
      setSelectedProduct(product ?? null);
    } else {
      setSelectedProduct(null);
    }
  }, [value, products]);

  const handleSelect = (product: ProductOption) => {
    setSelectedProduct(product);
    onChange({
      target: {
        name: name,
        value: product.ProductID.toString(),
      },
    });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSelectedProduct(null);
    onChange({
      target: {
        name: name,
        value: "",
      },
    });
    setSearchTerm("");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-describedby={describedBy}
          onClick={() => setIsOpen(true)}
          className="border-line-strong bg-surface hover:border-fg-muted focus-visible:outline-focus flex min-h-[52px] min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2"
        >
          <span
            className={
              selectedProduct ? "text-fg truncate font-medium" : "text-fg-muted"
            }
          >
            {selectedProduct ? selectedProduct.ProductName : "Seleccione un Producto..."}
          </span>
          <Search className="text-fg-muted h-5 w-5 shrink-0" aria-hidden="true" />
        </button>
        {selectedProduct && (
          <IconButton aria-label="Quitar producto seleccionado" onClick={handleClear}>
            <X aria-hidden="true" />
          </IconButton>
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Seleccionar Producto"
        size="lg"
        footer={
          selectedProduct && (
            <Button variant="primary" className="w-full" onClick={() => setIsOpen(false)}>
              Confirmar: {selectedProduct.ProductName}
            </Button>
          )
        }
      >
        <Input
          type="search"
          aria-label="Buscar producto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          icon={<Search className="h-5 w-5" />}
        />

        {searchTerm && filteredProducts.length === 0 ? (
          <p className="text-fg-muted px-4 py-8 text-center" role="status">
            No se encontraron productos
          </p>
        ) : (
          <ul className="mt-3 space-y-1" aria-label="Productos">
            {filteredProducts.map((product: ProductOption) => {
              const isSelected = selectedProduct?.ProductID === product.ProductID;
              return (
                <li key={product.ProductID}>
                  <button
                    type="button"
                    onClick={() => handleSelect(product)}
                    aria-pressed={isSelected}
                    className="hover:bg-surface-muted focus-visible:outline-focus flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                  >
                    <span className="text-fg font-medium">
                      {product.ProductName}{" "}
                      <span className="text-fg-muted ml-2 text-sm font-normal">
                        ({product.Barcode})
                      </span>
                    </span>
                    {isSelected && (
                      <Check className="text-accent h-5 w-5 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </>
  );
};

export default function AddProductToWarehouse() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params?.id as string;

  const [warehouse, setWarehouse] = useState<{ WarehouseName: string } | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    newQuantity: 0,
    quantityReserved: 0,
    reorderLevel: "",
    lastStockedDate: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(withBasePath("/api/products"));
        const data = await res.json();
        setProducts(data.products);
      } catch (error) {
        console.error("Error al obtener productos", error);
        toast.error("Error al obtener productos");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchWarehouse = async () => {
      if (!params?.id) return;
      setLoading(true);
      try {
        const res = await fetch(withBasePath(`/api/warehouses/${params.id}`));
        if (!res.ok) throw new Error("Error al cargar el almacén.");
        const data = await res.json();
        setWarehouse(data.warehouse);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouse();
  }, [params?.id]);

  const handleChange = (e: FieldChange) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "productId" || name === "reorderLevel" ? value : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(withBasePath("/api/inventory/update"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          warehouseId: warehouseId,
          productId: parseInt(formData.productId),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Error al actualizar inventario");
      }

      toast.success("Inventario Actualizado Satisfactoriamente!");
      router.push(`/dashboard/inventory`);
    } catch (error) {
      console.error("Error:", error);
      toast.error((error as Error).message || "Error al actualizar inventario");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Agregar a Inventario"
      subtitle={warehouse ? `Agregando stock en ${warehouse.WarehouseName}` : "Cargando..."}
      breadcrumbs={[
        { label: "Dashboard", href: withBasePath("/dashboard") },
        { label: "Inventario", href: withBasePath("/dashboard/inventory") },
        { label: "Agregar" },
      ]}
      backButton={{ href: `/dashboard/inventory`, label: "Volver al listado" }}
    >
      <div className="mx-auto max-w-xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Producto" required>
              <ProductSearchSelect
                products={products}
                value={formData.productId}
                onChange={handleChange}
                name="productId"
                placeholder="Buscar producto..."
              />
            </FormField>

            <FormField label="Cantidad Inicial" required>
              <Input
                type="number"
                name="newQuantity"
                min="0"
                value={formData.newQuantity.toString()}
                onChange={handleChange}
                placeholder="Ej. 100"
                required
              />
            </FormField>

            <FormField label="Cantidad mínima para ordenar (Nivel de reorden)">
              <Input
                type="number"
                name="reorderLevel"
                min="0"
                value={formData.reorderLevel}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </FormField>

            <FormField label="Fecha de Registro">
              <Input
                type="datetime-local"
                name="lastStockedDate"
                value={formData.lastStockedDate}
                onChange={handleChange}
                disabled
              />
            </FormField>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="primary"
                type="submit"
                isLoading={submitting}
                disabled={submitting || loading || !formData.productId}
                className="flex-1"
              >
                Agregar a Inventario
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push(`/dashboard/inventory`)}
                disabled={submitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
}
