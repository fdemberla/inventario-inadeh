"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";
import { Card, Button, FormField, Textarea } from "@/app/components/ui";
import { PageLayout } from "@/app/components/PageLayout";

export default function CreateSupplier() {
  const [supplierName, setSupplierName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) => /^[0-9]{7,8}$/.test(phone); // 7-8 digits

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!validateEmail(email)) {
      newErrors.email = "Correo electrónico no válido.";
    }

    if (!validatePhone(phone)) {
      newErrors.phone = "El teléfono debe tener entre 7 y 8 dígitos numéricos.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor corrige los errores antes de continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(withBasePath("/api/suppliers/create"), {
        method: "POST",
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

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Error al crear el proveedor");
      }

      toast.success("Proveedor creado exitosamente.");
      router.push("/dashboard/suppliers");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Hubo un error al crear el proveedor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Crear Proveedor"
      subtitle="Complete los datos para registrar un nuevo proveedor."
      backButton={{ href: "/dashboard/suppliers", label: "Volver a proveedores" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Proveedores", href: "/dashboard/suppliers" },
        { label: "Crear" },
      ]}
    >
    <Card className="w-full">
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
            required
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

        <FormField label="Dirección" id="address" required>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </FormField>

        <div className="border-line border-t pt-4 text-center">
          <Button type="submit" variant="primary" className="w-full sm:w-auto" isLoading={isSubmitting} disabled={isSubmitting}>
            Crear Proveedor
          </Button>
        </div>
      </form>
    </Card>
    </PageLayout>
  );
}
