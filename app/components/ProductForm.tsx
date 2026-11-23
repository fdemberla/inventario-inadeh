"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { toast } from "react-hot-toast";
import UnitForm from "@/app/components/UnitForm";
import { withBasePath } from "@/lib/utils";
import { Button, FormField, Modal, Card, Input, Select, Textarea } from "@/app/components/ui";

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
      <Card className="w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h1 className="text-fg mb-2 text-2xl font-bold">
            {formTitle}
          </h1>

          {/* Imagen */}
          <FormField label="Imagen del producto" id="product-image">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-fg file:bg-accent/10 file:text-accent hover:file:bg-accent/20 w-full cursor-pointer text-sm file:mr-4 file:min-h-11 file:cursor-pointer file:rounded-lg file:border-0 file:px-4 file:font-semibold"
            />
          </FormField>

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
              <label htmlFor="istmosearch" className="text-fg mb-2 block text-sm font-semibold">
                Buscar Producto Istmo
              </label>
              <div className="mb-3 flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    id="istmosearch"
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
                <ul
                  aria-label="Resultados de búsqueda Istmo"
                  className="border-line bg-surface mb-4 max-h-60 w-full overflow-y-auto rounded-xl border shadow-md"
                >
                  {results.map((product) => (
                    <li key={product.codigo}>
                      {/* Real button: reachable and selectable with the keyboard */}
                      <button
                        type="button"
                        onClick={() => handleSelectResult(product.codigo)}
                        className="text-fg hover:bg-accent/10 focus-visible:outline-focus min-h-11 w-full px-4 py-2 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2"
                      >
                        {product.nombre} <span className="text-fg-muted text-xs">({product.codigo})</span>
                      </button>
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
          <FormField label="Descripción" id="description">
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </FormField>

          {/* Código de barras */}
          <FormField
            label="Código de barras (Fabricante)"
            name="barcode"
            value={form.barcode}
            onChange={handleChange}
          />

          {/* Categoría y Costo */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <FormField label="Categoría" id="categoryID" required>
              <Select name="categoryID" value={form.categoryID} onChange={handleChange}>
                <option value="">Seleccione...</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryID}>
                    {cat.CategoryName}
                  </option>
                ))}
              </Select>
            </FormField>
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
            <FormField label="Sistema de unidades" id="unitSystem" required>
              <Select
                name="unitSystem"
                value={form.unitSystem}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    unitSystem: e.target.value,
                    unitID: "",
                  }));
                }}
              >
                <option value="">Seleccione...</option>
                {systemOptions.map((sys) => (
                  <option key={sys} value={sys}>
                    {sys}
                  </option>
                ))}
              </Select>
            </FormField>

            <div>
              <FormField label="Unidad" id="unitID" required>
                <Select
                  name="unitID"
                  value={form.unitID}
                  onChange={handleChange}
                  disabled={!form.unitSystem}
                >
                  <option value="">Seleccione...</option>
                  {filteredUnits.map((u) => (
                    <option key={u.UnitID} value={u.UnitID}>
                      {u.UnitName} ({u.Abbreviation})
                    </option>
                  ))}
                </Select>
              </FormField>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowUnitForm(true)}
              >
                + Nueva unidad
              </Button>
            </div>
          </div>

          {/* Proveedores */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-fg">
              Proveedores
            </h2>
            <div className="space-y-4">
              {supplierList.map((sup, i) => (
                <div
                  key={i}
                  className="border-line bg-surface-muted space-y-4 rounded-2xl border p-4"
                >
                  <FormField label="Proveedor">
                    <Select
                      value={sup.supplierID}
                      onChange={(e) => handleSupplierChange(i, "supplierID", e)}
                    >
                      {suppliers.map((s) => (
                        <option key={s.SupplierID} value={s.SupplierID}>
                          {s.SupplierName}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField
                    label="SKU del proveedor"
                    type="text"
                    value={sup.supplierSKU}
                    onChange={(e) => handleSupplierChange(i, "supplierSKU", e)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      label="Días de entrega"
                      type="number"
                      value={sup.leadTimeDays.toString()}
                      onChange={(e) => handleSupplierChange(i, "leadTimeDays", e)}
                    />
                    <FormField
                      label="Costo"
                      type="number"
                      step="0.01"
                      value={sup.cost.toString()}
                      onChange={(e) => handleSupplierChange(i, "cost", e)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <label className="text-fg flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={sup.isPrimarySupplier}
                        onChange={(e) =>
                          handleSupplierChange(i, "isPrimarySupplier", e)
                        }
                        className="accent-brand-azul h-5 w-5 cursor-pointer"
                      />
                      Proveedor principal
                    </label>
                    {supplierList.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveSupplier(i)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
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

          <div className="border-line mt-4 border-t pt-6">
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
