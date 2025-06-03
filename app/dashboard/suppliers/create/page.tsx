"use client";

import { useState } from "react";
import { TextInput, Button, Label, Textarea } from "flowbite-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function CreateSupplier() {
  const [supplierName, setSupplierName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
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

    try {
      const res = await fetch("/api/suppliers/create", {
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
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-2xl dark:text-white">Crear Nuevo Proveedor</h2>
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
            required
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
        <Button type="submit">Crear Proveedor</Button>
      </form>
    </div>
  );
}
