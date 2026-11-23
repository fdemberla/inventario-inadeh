"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { PageLayout } from "@/app/components/PageLayout";
import { Button, Input, Card, FormField } from "@/app/components/ui";

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
}

// Componente de búsqueda de productos con Glassmorphism
const ProductSearchSelect = ({
  products,
  value,
  onChange,
  placeholder = "Buscar producto...",
  name = "productId",
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

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-gray-900/40 backdrop-blur-md transition-opacity">
        <div className="w-full max-w-lg bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 dark:border-gray-700/50 flex flex-col h-[80vh] sm:h-[60vh] transform transition-all">
          {/* Header del modal */}
          <div className="sticky top-0 z-10 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-800/40 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Seleccionar Producto
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-black/5 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Campo de búsqueda */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-white/60 dark:border-gray-600/60 bg-white/50 dark:bg-gray-800/50 py-3 pr-4 pl-12 text-base focus:border-brand-azul focus:ring-2 focus:ring-brand-azul/30 dark:focus:ring-brand-verde/30 focus:outline-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] dark:text-white transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-y-auto p-2">
            {searchTerm && filteredProducts.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No se encontraron productos
              </div>
            ) : (
              <div className="space-y-1">
                {filteredProducts.map((product: ProductOption) => (
                  <button
                    key={product.ProductID}
                    type="button"
                    onClick={() => handleSelect(product)}
                    className="w-full rounded-xl px-4 py-3 text-left transition-all duration-200 hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {product.ProductName} <span className="text-gray-400 font-normal text-sm ml-2">({product.Barcode})</span>
                      </span>
                      {selectedProduct?.ProductID === product.ProductID && (
                        <div className="rounded-full bg-brand-azul/20 dark:bg-brand-verde/20 p-1">
                          <svg className="h-5 w-5 text-brand-azul dark:text-brand-verde" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedProduct && (
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-800/40 p-4 backdrop-blur-md">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Confirmar: {selectedProduct.ProductName}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsOpen(true)}
      className="flex min-h-[52px] w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white/60 px-4 py-3 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-sm transition-all hover:border-brand-azul/50 hover:bg-white/80 active:scale-[0.99] dark:border-gray-700/60 dark:bg-gray-800/60 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] dark:hover:border-brand-verde/50"
    >
      <div className="flex min-w-0 flex-1 items-center">
        {selectedProduct ? (
          <div className="flex w-full items-center justify-between">
            <span className="truncate pr-2 font-medium text-gray-900 dark:text-white">
              {selectedProduct.ProductName}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="flex-shrink-0 rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">Seleccione un Producto...</span>
        )}
      </div>
      {!selectedProduct && (
        <svg className="h-5 w-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )}
    </div>
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
