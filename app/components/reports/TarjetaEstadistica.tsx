const TarjetaEstadistica = ({ titulo, valor, icon: Icon }) => (
  <div className="rounded-lg border bg-white p-6 shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{titulo}</p>
        <p className="text-2xl font-bold text-gray-900">{valor}</p>
      </div>
      <Icon className="h-8 w-8 text-blue-500" />
    </div>
  </div>
);

export default TarjetaEstadistica;
