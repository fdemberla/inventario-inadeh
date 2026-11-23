"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { toast } from "react-hot-toast";
import UnitForm from "@/app/components/UnitForm";
import { withBasePath } from "@/lib/utils";
import { Button, FormField, Modal, Card, Input } from "@/app/components/ui";

interface Category {
  CategoryID: number;
  CategoryName: string;
}

interface Unit {
  UnitID: number;
  System: string;
  UnitName: string;
  Abbreviation: string;
}

interface Supplier {
  SupplierID: number;
  SupplierName: string;
}

interface SupplierEntry {
  supplierID: number;
  supplierSKU: string;
  leadTimeDays: number;
  cost: number;
  isPrimarySupplier: boolean;
}

interface ProductFormProps {
  initialData?: {
    productName?: string;
    sku?: string;
    description?: string;
    barcode?: string;
    categoryID?: string;
    cost?: string;
    unitID?: string;
    unitSystem?: string;
    suppliers?: SupplierEntry[];
  };
  onSubmit: (data: {
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
  }) => Promise<void>;
  isSubmitting?: boolean;
  formTitle?: string;
  submitButtonText?: string;
  showIstmoSearch?: boolean;
}

export default function ProductForm({
  initialData = {},
  onSubmit,
  isSubmitting = false,
  formTitle = "Nuevo Producto",
  submitButtonText = "Crear producto",
  showIstmoSearch = true,
}: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [showUnitForm, setShowUnitForm] = useState(false);

  const [form, setForm] = useState({
    productName: initialData.productName || "",
    sku: initialData.sku || "",
    description: initialData.description || "",
    barcode: initialData.barcode || "",
    categoryID: initialData.categoryID || "",
    cost: initialData.cost || "0.00",
    unitID: initialData.unitID || "",
    unitSystem: initialData.unitSystem || "",
  });

  const [supplierList, setSupplierList] = useState<SupplierEntry[]>(
    initialData.suppliers || [],
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{codigo: string, nombre: string, descripcion: string}[]>([]);
  const [showResults, setShowResults] = useState(false);

  const systemOptions = [...new Set(units.map((u) => u.System))];
  const filteredUnits = units.filter((u) => u.System === form.unitSystem);

  const fetchUnits = () => {
    fetch(withBasePath("/api/units"))
      .then((res) => res.json())
      .then((response) => setUnits(response));
  };

  useEffect(() => {
    fetch(withBasePath("/api/categories"))
      .then((res) => res.json())
      .then((response) => setCategories(response));
    fetchUnits();
    fetch(withBasePath("/api/suppliers"))
      .then((res) => res.json())
      .then((response) => setSuppliers(response));
  }, []);

  const handleNewUnitSuccess = () => {
    toast.success("Unidad creada exitosamente");
    setShowUnitForm(false);
    fetchUnits();
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSupplier = () => {
    setSupplierList((prev) => [
      ...prev,
      {
        supplierID: suppliers[0]?.SupplierID ?? 0,
        supplierSKU: "",
        leadTimeDays: 0,
        cost: 0,
        isPrimarySupplier: false,
      },
    ]);
  };

  const handleSupplierChange = (
    index: number,
    key: keyof SupplierEntry,
    value:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | boolean
      | string
      | number,
  ) => {
    const updated = [...supplierList];
    if (key === "isPrimarySupplier") {
      updated[index][key] =
        typeof value === "object" && "target" in value
          ? (value as React.ChangeEvent<HTMLInputElement>).target.checked
          : Boolean(value);
    } else {
      const rawValue =
        typeof value === "object" && "target" in value
          ? (value as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)
              .target.value
          : value;
      (updated[index] as Record<string, unknown>)[key] = rawValue;
    }
    setSupplierList(updated);
  };

  const handleRemoveSupplier = (index: number) => {
    const updated = supplierList.filter((_, i) => i !== index);
    setSupplierList(updated);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  };

  const searchIstmoProducts = async (q: string) => {
    try {
      const res = await fetch(
        withBasePath(`/api/products/search-istmo?q=${encodeURIComponent(q)}`),
      );
      const data = await res.json();
      const empty = {
        codigo: "0",
        nombre: "No Aparece En Lista",
        descripcion: "No Aparece En Lista",
      };

      const resultados = [...data.results, empty];
      setResults(resultados || []);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    }
  };

  const handleSearchClick = () => {
    if (query.trim()) {
      searchIstmoProducts(query);
    }
  };

  const handleSelectResult = (value: string) => {
    setForm((prev) => ({ ...prev, sku: value }));
    setShowResults(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      image: image || undefined,
      suppliers: supplierList,
    });
  };

  return (
    <>
      <Card className="w-full border-none shadow-lg dark:bg-gray-900/40">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {formTitle}
          </h1>

          {/* Imagen */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Imagen del producto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full rounded-2xl p-3 text-sm text-gray-900 dark:text-gray-200 file:mr-4 file:rounded-md file:border-0 file:bg-brand-azul/10 file:px-4 file:py-2 file:text-brand-azul file:font-semibold hover:file:bg-brand-azul/20 dark:bg-gray-800 dark:file:bg-brand-azul/20 dark:file:text-blue-300 dark:hover:file:bg-brand-azul/30 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="Nombre del producto"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              required
              placeholder="Ej. Clavos de acero"
            />
          </div>

          {/* Buscador ISTMO */}
          {showIstmoSearch && (
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Buscar Producto Istmo
              </label>
              <div className="mb-3 flex space-x-3 items-end">
                <div className="flex-1">
                  <Input
                    type="text"
                    name="istmosearch"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ingrese nombre..."
                  />
                </div>
                <Button type="button" variant="primary" onClick={handleSearchClick}>
                  Buscar
                </Button>
              </div>

              {showResults && results.length > 0 && (
                <ul className="mb-4 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
                  {results.map((product) => (
                    <li
                      key={product.codigo}
                      onClick={() => handleSelectResult(product.codigo)}
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-brand-azul/10 dark:text-white dark:hover:bg-gray-700"
                    >
                      {product.nombre} <span className="text-xs text-gray-500">({product.codigo})</span>
                    </li>
                  ))}
                </ul>
              )}

              <FormField
                label="Código ISTMO"
                name="sku"
                value={form.sku}
                readOnly
                disabled
              />
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-xl px-4 py-3 text-base font-normal transition-all duration-300 ease-out border border-white/50 bg-white/40 dark:border-white/10 dark:bg-gray-900/40 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-gray-800/70 focus-visible:ring-2 focus-visible:ring-brand-azul/50 focus-visible:border-brand-azul/30 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:border-white/60 dark:hover:border-white/20"
              rows={3}
            />
          </div>

          {/* Código de barras */}
          <FormField
            label="Código de barras (Fabricante)"
            name="barcode"
            value={form.barcode}
            onChange={handleChange}
          />

          {/* Categoría y Costo */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="w-full space-y-2">
              <div className="flex items-center gap-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Categoría
                </label>
                <span className="text-red-600 dark:text-red-400" aria-label="Requerido">*</span>
              </div>
              <select
                name="categoryID"
                value={form.categoryID}
                onChange={handleChange}
                required
                className="w-full rounded-xl px-4 py-3 text-base font-normal transition-all duration-300 ease-out border border-white/50 bg-white/40 dark:border-white/10 dark:bg-gray-900/40 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-gray-800/70 focus-visible:ring-2 focus-visible:ring-brand-azul/50 focus-visible:border-brand-azul/30 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:border-white/60 dark:hover:border-white/20"
              >
                <option value="">Seleccione...</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryID}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
            </div>
            <FormField
              label="Costo"
              name="cost"
              type="number"
              step="0.01"
              value={form.cost}
              onChange={handleChange}
            />
          </div>

          {/* Sistema y Unidad */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sistema de unidades
              </label>
              <select
                name="unitSystem"
                value={form.unitSystem}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    unitSystem: e.target.value,
                    unitID: "",
                  }));
                }}
                required
                className="w-full rounded-xl px-4 py-3 text-base font-normal transition-all duration-300 ease-out border border-white/50 bg-white/40 dark:border-white/10 dark:bg-gray-900/40 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-gray-800/70 focus-visible:ring-2 focus-visible:ring-brand-azul/50 focus-visible:border-brand-azul/30 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:border-white/60 dark:hover:border-white/20"
              >
                <option value="">Seleccione...</option>
                {systemOptions.map((sys) => (
                  <option key={sys} value={sys}>
                    {sys}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unidad
                </label>
                <button
                  type="button"
                  onClick={() => setShowUnitForm(true)}
                  className="text-xs font-semibold text-brand-azul hover:underline dark:text-blue-400"
                >
                  + Nueva unidad
                </button>
              </div>
              <select
                name="unitID"
                value={form.unitID}
                onChange={handleChange}
                disabled={!form.unitSystem}
                required
                className="w-full mt-1 rounded-xl px-4 py-3 text-base font-normal transition-all duration-300 ease-out border border-white/50 bg-white/40 dark:border-white/10 dark:bg-gray-900/40 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-gray-800/70 focus-visible:ring-2 focus-visible:ring-brand-azul/50 focus-visible:border-brand-azul/30 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:border-white/60 dark:hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100/50 dark:disabled:bg-gray-800/30"
              >
                <option value="">Seleccione...</option>
                {filteredUnits.map((u) => (
                  <option key={u.UnitID} value={u.UnitID}>
                    {u.UnitName} ({u.Abbreviation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Proveedores */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
              Proveedores
            </h2>
            <div className="space-y-4">
              {supplierList.map((sup, i) => (
                <Card
                  key={i}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 space-y-4 border border-gray-200 dark:border-gray-700"
                  noShadow
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
                    <select
                      value={sup.supplierID}
                      onChange={(e) => handleSupplierChange(i, "supplierID", e)}
                      className="w-full rounded-xl px-4 py-3 text-base font-normal transition-all duration-300 ease-out border border-white/50 bg-white/40 dark:border-white/10 dark:bg-gray-900/40 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-gray-800/70 focus-visible:ring-2 focus-visible:ring-brand-azul/50 focus-visible:border-brand-azul/30 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:border-white/60 dark:hover:border-white/20"
                    >
                      {suppliers.map((s) => (
                        <option key={s.SupplierID} value={s.SupplierID}>
                          {s.SupplierName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    type="text"
                    placeholder="SKU del proveedor"
                    value={sup.supplierSKU}
                    onChange={(e) => handleSupplierChange(i, "supplierSKU", e)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Días de entrega"
                      value={sup.leadTimeDays.toString()}
                      onChange={(e) => handleSupplierChange(i, "leadTimeDays", e)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Costo"
                      value={sup.cost.toString()}
                      onChange={(e) => handleSupplierChange(i, "cost", e)}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sup.isPrimarySupplier}
                        onChange={(e) =>
                          handleSupplierChange(i, "isPrimarySupplier", e)
                        }
                        className="h-5 w-5 rounded border-gray-300 text-brand-azul accent-brand-azul focus:ring-brand-azul cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Proveedor principal
                      </span>
                    </label>
                    {supplierList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSupplier(i)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={handleAddSupplier}
            >
              + Agregar proveedor
            </Button>
          </div>

          <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {submitButtonText}
            </Button>
          </div>
        </form>
      </Card>

      {/* Modal para nueva unidad */}
      <Modal
        isOpen={showUnitForm}
        onClose={() => setShowUnitForm(false)}
        title="Crear Nueva Unidad"
        size="md"
      >
        <div className="p-1">
          <UnitForm
            onSuccess={handleNewUnitSuccess}
            onCancel={() => setShowUnitForm(false)}
            title=""
          />
        </div>
      </Modal>
    </>
  );
}
