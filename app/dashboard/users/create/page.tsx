import UserForm from "@/app/components/UserForm";
import { PageLayout } from "@/app/components/PageLayout";

export default function CreateUserPage() {
  return (
    <PageLayout
      title="Crear Usuario"
      subtitle="Complete los datos para registrar un nuevo usuario en el sistema."
      backButton={{ href: "/dashboard/users", label: "Volver a usuarios" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Usuarios", href: "/dashboard/users" },
        { label: "Crear" },
      ]}
    >
      <UserForm />
    </PageLayout>
  );
}
