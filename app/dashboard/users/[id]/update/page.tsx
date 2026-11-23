"use client";

import { useParams } from "next/navigation";
import UserForm from "@/app/components/UserForm";
import { PageLayout } from "@/app/components/PageLayout";

export default function EditUserPage() {
  const { id } = useParams();

  return (
    <PageLayout
      title="Editar Usuario"
      subtitle="Actualice los datos y permisos del usuario."
      backButton={{ href: "/dashboard/users", label: "Volver a usuarios" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Usuarios", href: "/dashboard/users" },
        { label: "Editar" },
      ]}
    >
      <UserForm userId={id} isEditMode={true} />
    </PageLayout>
  );
}
