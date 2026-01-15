// app/dashboard/suppliers/edit/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TextInput, Button, Label, Textarea } from "flowbite-react";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";

export default function EditSupplier() {
  const { id } = useParams();
  const router = useRouter();

  const [supplierName, setSupplierName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

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
      router.push(withBasePath("/dashboard/suppliers"));
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el proveedor.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-2xl dark:text-white">Editar Proveedor</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="supplier-name">Nombre del Proveedor</Label>
          <TextInput
            id="supplier-name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="contact-person">Persona de Contacto</Label>
          <TextInput
            id="contact-person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <TextInput
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
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Correo Electrónico</Label>
          <TextInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        <div>
          <Label htmlFor="address">Dirección</Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Actualizar Proveedor</Button>
      </form>
    </div>
  );
}
