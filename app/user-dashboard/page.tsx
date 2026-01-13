// app/user-dashboard/page.tsx
import { PageLayout } from "@/app/components/PageLayout";
import { Card, CardBody, CardHeader } from "@/app/components/ui";

export default function UserHomePage() {
  return (
    <PageLayout
      title="Panel de Usuario"
      subtitle="Bienvenido a tu dashboard personal"
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h3 className="font-bold">Inventario</h3>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600 dark:text-gray-400">
              Consulta el estado actual de tu inventario
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Órdenes</h3>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600 dark:text-gray-400">
              Visualiza tus órdenes pendientes
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Reportes</h3>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600 dark:text-gray-400">
              Genera reportes de inventario
            </p>
          </CardBody>
        </Card>
      </div>
    </PageLayout>
  );
}
