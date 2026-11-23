import { Card } from "@/app/components/ui";

const TarjetaEstadistica = ({ titulo, valor, icon: Icon }) => (
  <Card hoverable className="h-full">
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{titulo}</p>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-azul/10 dark:bg-brand-verde/10 text-brand-azul dark:text-brand-verde border border-brand-azul/20 dark:border-brand-verde/20">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-2">{valor}</p>
    </div>
  </Card>
);

export default TarjetaEstadistica;
