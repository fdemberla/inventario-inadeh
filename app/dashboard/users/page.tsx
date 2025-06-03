"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "flowbite-react";
import { DataTable } from "../../components/DataTable";

type User = {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  RoleName: string;
  IsActive: boolean;
};

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || data)) // adjust based on your API format
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      accessorKey: "FullName",
      header: "Nombre",
      cell: ({ row }) => `${row.original.FirstName} ${row.original.LastName}`,
    },
    { accessorKey: "RoleName", header: "Rol" },
    { accessorKey: "Email", header: "Correo" },
    {
      accessorKey: "IsActive",
      header: "Activo",
      cell: ({ getValue }) => (getValue() ? "Sí" : "No"),
    },
    {
      header: "Acciones",
      cell: ({ row }) => (
        <Button
          size="xs"
          onClick={() =>
            router.push(`/dashboard/users/${row.original.UserID}/update`)
          }
          className="bg-brand-naranja"
        >
          Editar
        </Button>
      ),
    },
  ];

  if (loading)
    return (
      <div className="flex justify-center p-6">
        <Spinner size="xl" />
      </div>
    );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button
          onClick={() => router.push("/dashboard/users/create")}
          className="bg-brand-verde"
        >
          Crear Usuario
        </Button>
      </div>
      <DataTable data={users} columns={columns} />
    </div>
  );
}
