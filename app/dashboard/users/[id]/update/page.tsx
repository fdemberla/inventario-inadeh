"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Label,
  TextInput,
  Select,
  Checkbox,
  Spinner,
} from "flowbite-react";
import { toast } from "react-hot-toast";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();

  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    Username: "",
    RoleID: "",
    FirstName: "",
    LastName: "",
    Phone: "",
    Email: "",
    IsActive: true,
    Warehouses: [],
    WarehouseIDs: [],
  });
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility

  useEffect(() => {
    async function fetchData() {
      const loadingToast = toast.loading("Cargando datos del usuario...");
      try {
        // Fetch roles and warehouses
        const [rolesRes, whRes, userRes] = await Promise.all([
          fetch("/api/roles"),
          fetch("/api/warehouses"),
          fetch(`/api/users/${id}`), // Fetch user data by ID
        ]);
        const rolesData = await rolesRes.json();
        const whData = await whRes.json();
        const userData = await userRes.json();

        setRoles(rolesData.roles || []);
        setWarehouses(whData.warehouses.recordset || []);
        setFormData(userData.user || {});

        setFormData({
          ...userData.user,
          WarehouseIDs:
            userData.user.Warehouses?.map((w) => w.WarehouseID) || [],
        });

        toast.success("Datos cargados con éxito.");
      } catch (err) {
        console.error("Error loading data", err);
        toast.error("Error cargando los datos.");
      } finally {
        setLoading(false);
        toast.dismiss(loadingToast);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove non-numeric characters
    value = value.replace(/\D/g, "");

    // Validate phone number length (7 or 8 digits)
    if (value.length > 8) {
      return;
    }

    // Update formData with the formatted phone number
    setFormData((prev) => ({
      ...prev,
      Phone: value,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleWarehouseChange = (id: number) => {
    setFormData((prev) => {
      const current = prev.WarehouseIDs || [];
      const isSelected = current.includes(id);
      const newIDs = isSelected
        ? current.filter((wid) => wid !== id)
        : [...current, id];
      return { ...prev, WarehouseIDs: newIDs };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const updatedData = { ...formData };

    // Only include password if user typed one
    if (
      typeof updatedData.Password === "string" &&
      updatedData.Password.trim() !== ""
    ) {
      const passwordValid = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(
        updatedData.Password,
      );
      if (!passwordValid) {
        toast.error(
          "La contraseña debe tener al menos 8 caracteres, una letra y un número.",
        );
        setSubmitting(false);
        return;
      }
    } else {
      delete updatedData.Password;
    }

    try {
      const res = await fetch(`/api/users/${id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || "Error al actualizar el usuario.");
      }

      toast.success("Usuario actualizado con éxito.");
      router.push("/dashboard/users");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-6">
        <Spinner size="xl" />
      </div>
    );

  const selectedWarehouseIDs = formData.WarehouseIDs || [];

  return (
    <div className="max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Editar Usuario</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="FirstName">Nombre</Label>
          <TextInput
            name="FirstName"
            value={formData.FirstName}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="LastName">Apellido</Label>
          <TextInput
            name="LastName"
            value={formData.LastName}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="Phone">Teléfono</Label>
          <TextInput
            name="Phone"
            value={formData.Phone}
            onChange={handlePhoneChange}
            maxLength={9}
          />
        </div>

        <div>
          <Label htmlFor="Email">Correo electrónico</Label>
          <TextInput
            type="email"
            name="Email"
            value={formData.Email}
            onChange={handleChange}
          />
        </div>

        <div className="mt-9">
          <Label htmlFor="Username" className="mt-3">
            Nombre de usuario
          </Label>
          <TextInput
            name="Username"
            value={formData.Username}
            readOnly
            disabled
            placeholder="Usuario"
          />
        </div>

        <div>
          <Label htmlFor="Password">Contraseña</Label>
          <TextInput
            type={showPassword ? "text" : "password"}
            name="Password"
            value={formData.Password}
            onChange={handleChange}
            placeholder="Deja en blanco para mantener la contraseña"
          />
        </div>

        <div className="flex items-center">
          <Checkbox
            id="showPassword"
            onChange={() => setShowPassword(!showPassword)}
          />
          <Label htmlFor="showPassword" className="ml-2">
            Mostrar contraseña
          </Label>
        </div>

        <div>
          <Checkbox
            name="IsActive"
            checked={formData.IsActive}
            onChange={handleChange}
          />
          <Label htmlFor="IsActive" className="ml-2">
            Activo
          </Label>
        </div>

        <div>
          <Label htmlFor="RoleID">Rol</Label>
          <Select
            name="RoleID"
            value={formData.RoleID}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un rol</option>
            {roles.map((r) => (
              <option key={r.RoleID} value={r.RoleID}>
                {r.RoleName}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Depósitos asignados</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {warehouses.map((w) => (
              <label key={w.WarehouseID} className="flex items-center">
                <Checkbox
                  checked={selectedWarehouseIDs.includes(w.WarehouseID)}
                  onChange={() => handleWarehouseChange(w.WarehouseID)}
                />

                <span className="ml-2 dark:text-white">
                  {w.WarehouseCode} - {w.WarehouseName}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Actualizando..." : "Actualizar Usuario"}
          </Button>
        </div>
      </form>
    </div>
  );
}
