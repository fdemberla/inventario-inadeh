"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { Card, Button, FormField } from "@/app/components/ui";

export default function EditSupplier() {
  const { id } = useParams();
  const router = useRouter();

  const [supplierName, setSupplierName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(withBasePath(`/api/suppliers/${id}`));
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error loading supplier");

        setSupplierName(data.supplier.SupplierName);
        setContactPerson(data.supplier.ContactPerson || "");
        setPhone(data.supplier.Phone || "");
        setEmail(data.supplier.Email || "");
        setAddress(data.supplier.Address || "");
      } catch (error) {
        toast.error("Error cargando proveedor.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) => /^[0-9]{7,8}$/.test(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!validateEmail(email)) {
      newErrors.email = "Correo electrónico no válido.";
    }

    if (!validatePhone(phone)) {
      newErrors.phone =
        "El teléfono debe contener solo números y entre 7 y 8 dígitos.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(withBasePath(`/api/suppliers/${id}/edit`), {
        method: "PUT",
        body: JSON.stringify({
          supplierName,
          contactPerson,
          phone,
          email,
          address,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Error actualizando proveedor");

      toast.success("Proveedor actualizado correctamente.");
      router.push("/dashboard/suppliers");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el proveedor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div role="status" aria-label="Cargando...">
          <div className="border-t-brand-azul dark:border-t-brand-verde h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <span className="sr-only">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full p-6 shadow-lg border-none bg-white dark:bg-gray-900 mt-6">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white text-center">Editar Proveedor</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label="Nombre del Proveedor"
            id="supplier-name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <FormField
            label="Persona de Contacto"
            id="contact-person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            disabled={isSubmitting}
          />
          <FormField
            label="Teléfono"
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9]{0,8}$/.test(val)) {
                setPhone(val);
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }
            }}
            required
            error={errors.phone}
            disabled={isSubmitting}
          />
          <FormField
            label="Correo Electrónico"
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            required
            error={errors.email}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="w-full space-y-2">
          <div className="flex items-center gap-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Dirección
            </label>
            <span className="text-red-600 dark:text-red-400" aria-label="Requerido">*</span>
          </div>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-normal transition-all duration-200 ease-in-out focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-brand-azul focus-visible:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus-visible:ring-blue-400 hover:border-gray-400 dark:hover:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800/50 dark:disabled:text-gray-500 dark:disabled:border-gray-700"
            rows={3}
          />
        </div>

        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="submit" variant="primary" className="w-full sm:w-auto px-8" isLoading={isSubmitting} disabled={isSubmitting}>
            Actualizar Proveedor
          </Button>
        </div>
      </form>
    </Card>
  );
}
