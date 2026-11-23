"use client";

import { useEffect, useId, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ClipboardCheck,
  DollarSign,
  PackageX,
  RefreshCcw,
} from "lucide-react";
import { PageLayout } from "@/app/components/PageLayout";
import { Card, Select, Spinner } from "@/app/components/ui";
import ExcelExportButton from "@/app/components/reports/BotonExportar";
import { KpiTile } from "@/app/components/reports/KpiTile";
import { MovementsChart } from "@/app/components/reports/MovementsChart";
import { withBasePath } from "@/lib/utils";
import type { KpiRow, WarehouseKpis } from "@/lib/reports/kpis";

const PERIODS = [7, 30, 90, 365] as const;
const AT_RISK_DAYS = 14;
const WINDOW_DAYS = 90;

const money = (n: number) =>
  n.toLocaleString("es-PA", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol", // "$50,402", not "USD 50,402"
    maximumFractionDigits: 0,
  });
// Tiny non-zero values must not read as "0"
const ratio = (n: number) =>
  n > 0 && n < 0.01 ? "< 0.01" : n.toLocaleString("es-PA", { maximumFractionDigits: 2 });
const int = (n: number) => n.toLocaleString("es-PA", { maximumFractionDigits: 0 });
const pct = (n: number) => n.toLocaleString("es-PA", { style: "percent", maximumFractionDigits: 1 });
const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-PA", { day: "numeric", month: "short", year: "numeric" }) : "—";

interface Category {
  CategoryID: number;
  CategoryName: string;
}

export default function WarehouseKpiPage() {
  const params = useParams<{ id: string }>();
  const periodGroupId = useId();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(90);
  const [category, setCategory] = useState("todas");
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouseName, setWarehouseName] = useState<string>("");
  const [data, setData] = useState<WarehouseKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(withBasePath(`/api/warehouses/${params.id}`)).then((r) => (r.ok ? r.json() : null)),
      fetch(withBasePath("/api/categories")).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([w, c]) => {
        setWarehouseName(w?.warehouse?.WarehouseName ?? "");
        setCategories(Array.isArray(c) ? c : []);
      })
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(withBasePath(`/api/reports/${params.id}/kpis?days=${days}&category=${category}`))
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.message || "No se pudieron cargar los indicadores.");
        return body as WarehouseKpis;
      })
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.id, days, category]);

  const s = data?.summary;
  const movementLines = s ? s.receipts.lines + s.shipments.lines + s.adjustments.lines : 0;

  return (
    <PageLayout
      title="Indicadores del almacén"
      subtitle={warehouseName || undefined}
      backButton={{ href: "/dashboard/reports", label: "Todos los almacenes" }}
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Reportes", href: "/dashboard/reports" },
        { label: warehouseName || "Almacén" },
      ]}
      actions={<ExcelExportButton warehouseId={parseInt(params.id, 10)} />}
    >
      <div className="space-y-6">
        {/* Filters: one row above everything they affect */}
        <Card noPadding className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <fieldset>
            <legend id={periodGroupId} className="text-fg mb-2 text-sm font-semibold">
              Período
            </legend>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <label key={p} className="cursor-pointer">
                  <input
                    type="radio"
                    name="period"
                    value={p}
                    checked={days === p}
                    onChange={() => setDays(p)}
                    className="peer sr-only"
                  />
                  <span className="border-line-strong text-fg peer-checked:border-accent peer-checked:bg-accent peer-checked:text-surface peer-focus-visible:outline-focus flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                    {p === 365 ? "12 meses" : `${p} días`}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="w-full sm:w-64">
            <Select
              aria-label="Filtrar por categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.CategoryID} value={c.CategoryID}>
                  {c.CategoryName}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <div aria-live="polite" aria-busy={loading}>
          {loading && !data && (
            <div role="status" className="text-fg-muted flex items-center gap-2 py-12">
              <Spinner size="sm" /> Calculando indicadores…
            </div>
          )}
          {error && (
            <p role="alert" className="bg-danger/10 text-danger-fg rounded-xl p-4">
              {error}
            </p>
          )}
        </div>

        {s && data && (
          <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {movementLines === 0 && (
              <p className="bg-warning/10 text-warning rounded-xl p-4 text-sm">
                No hubo movimientos en {days === 365 ? "los últimos 12 meses" : `los últimos ${days} días`}.
                Los indicadores de stock (valor, faltantes, inmovilizado) siguen siendo válidos;
                los de flujo aparecen en cero. Pruebe un período más largo.
              </p>
            )}

            {/* Headline KPIs */}
            <section aria-labelledby="kpi-title">
              <h2 id="kpi-title" className="sr-only">Indicadores principales</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <KpiTile
                  label="Valor del inventario"
                  value={money(s.stockValue)}
                  icon={DollarSign}
                  detail={`${int(s.skusWithStock)} productos con stock${s.skusWithoutCost ? ` · ${int(s.skusWithoutCost)} sin costo (no suman)` : ""}`}
                />
                <KpiTile
                  label="Faltantes con demanda"
                  value={int(s.stockoutsWithDemand)}
                  icon={PackageX}
                  status={s.stockoutsWithDemand > 0 ? { tone: "danger", label: "Requiere acción" } : { tone: "success", label: "Sin faltantes" }}
                  detail={`Stock en 0 con despachos en ${WINDOW_DAYS} días`}
                />
                <KpiTile
                  label={`En riesgo (< ${AT_RISK_DAYS} días de cobertura)`}
                  value={int(s.atRisk)}
                  icon={AlertTriangle}
                  status={s.atRisk > 0 ? { tone: "warning", label: "Reabastecer" } : undefined}
                  detail={`Según el ritmo de despacho de ${WINDOW_DAYS} días`}
                />
                <KpiTile
                  label="Stock inmovilizado"
                  value={money(s.idleValue)}
                  icon={Archive}
                  status={
                    s.stockValue > 0
                      ? { tone: s.idleValue / s.stockValue > 0.5 ? "warning" : "neutral", label: `${pct(s.idleValue / s.stockValue)} del valor` }
                      : undefined
                  }
                  detail={`${int(s.idleSkus)} productos sin movimiento en ${WINDOW_DAYS} días`}
                />
                <KpiTile
                  label="Rotación anualizada"
                  value={s.turnover === null ? "—" : `${ratio(s.turnover)} veces/año`}
                  icon={RefreshCcw}
                  detail={`Costo despachado: ${money(s.shipments.cost)} en el período`}
                />
                <KpiTile
                  label="Ajustes sobre movimientos"
                  value={s.adjustmentShare === null ? "—" : pct(s.adjustmentShare)}
                  icon={ClipboardCheck}
                  status={
                    s.adjustmentShare !== null && s.adjustmentShare > 0.05
                      ? { tone: "warning", label: "Revisar exactitud" }
                      : undefined
                  }
                  detail={`${int(s.adjustments.lines)} de ${int(movementLines)} líneas · ${money(s.adjustments.absValue)} ajustados`}
                />
              </div>
            </section>

            {/* Flow */}
            <Card noPadding className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-fg text-lg font-semibold">Recepciones y despachos</h2>
                  <p className="text-fg-muted text-sm">
                    Unidades por {data.series.granularity === "week" ? "semana" : "día"}
                  </p>
                </div>
                <dl className="flex gap-6 text-sm">
                  <div>
                    <dt className="text-fg-muted">Recepciones</dt>
                    <dd className="text-fg font-semibold tabular-nums">
                      {int(s.receipts.lines)} líneas · {int(s.receipts.units)} u.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-fg-muted">Despachos</dt>
                    <dd className="text-fg font-semibold tabular-nums">
                      {int(s.shipments.lines)} líneas · {int(s.shipments.units)} u.
                    </dd>
                  </div>
                </dl>
              </div>
              <MovementsChart points={data.series.points} granularity={data.series.granularity} />
            </Card>

            {/* Action lists */}
            <section aria-labelledby="attention-title" className="space-y-3">
              <h2 id="attention-title" className="text-fg text-lg font-semibold">
                Requiere atención
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                <ActionList
                  title="Faltantes con demanda"
                  empty="Ningún producto con demanda está agotado."
                  rows={data.stockouts}
                  columns={[
                    { label: `Desp. ${WINDOW_DAYS} d`, value: (r) => int(r.shipped90) },
                    { label: "Último mov.", value: (r) => date(r.lastMovement) },
                  ]}
                />
                <ActionList
                  title={`En riesgo (< ${AT_RISK_DAYS} días)`}
                  empty="Ningún producto con demanda queda por debajo de la cobertura mínima."
                  rows={data.atRisk}
                  columns={[
                    { label: "Stock", value: (r) => int(r.quantity) },
                    { label: "Cobertura", value: (r) => `${(r.coverDays ?? 0).toLocaleString("es-PA", { maximumFractionDigits: 1 })} d` },
                  ]}
                />
                <ActionList
                  title="Inmovilizado (mayor valor)"
                  empty="Todo el stock tuvo movimiento recientemente."
                  rows={data.idle}
                  columns={[
                    { label: "Valor", value: (r) => (r.unitCost ? money(r.quantity * r.unitCost) : "sin costo") },
                    { label: "Último mov.", value: (r) => date(r.lastMovement) },
                  ]}
                />
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Productivity */}
              <Card noPadding className="p-4 sm:p-6">
                <h2 className="text-fg mb-3 text-lg font-semibold">Actividad por usuario</h2>
                {data.users.length === 0 ? (
                  <p className="text-fg-muted text-sm">Sin movimientos en el período.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">Líneas registradas por usuario en el período</caption>
                      <thead className="text-fg-muted">
                        <tr>
                          <th scope="col" className="py-2 pr-4 font-semibold">Usuario</th>
                          <th scope="col" className="py-2 pr-4 text-right font-semibold">Recep.</th>
                          <th scope="col" className="py-2 pr-4 text-right font-semibold">Desp.</th>
                          <th scope="col" className="py-2 text-right font-semibold">Ajustes</th>
                        </tr>
                      </thead>
                      <tbody className="text-fg">
                        {data.users.map((u) => {
                          const generic = ["WEB_USER", "scanner", "(sin usuario)"].includes(u.user);
                          return (
                            <tr key={u.user} className="border-line border-t">
                              <th scope="row" className="py-2 pr-4 font-medium">
                                {generic ? (
                                  <span className="text-fg-muted">
                                    {u.user} <span className="text-xs">(no identificado)</span>
                                  </span>
                                ) : (
                                  u.user
                                )}
                              </th>
                              <td className="py-2 pr-4 text-right tabular-nums">{int(u.receipts)}</td>
                              <td className="py-2 pr-4 text-right tabular-nums">{int(u.shipments)}</td>
                              <td className="py-2 text-right tabular-nums">{int(u.adjustments)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Data quality */}
              <Card noPadding className="p-4 sm:p-6">
                <h2 className="text-fg mb-1 text-lg font-semibold">Calidad de datos</h2>
                <p className="text-fg-muted mb-3 text-sm">Lo que hoy limita la exactitud de estos indicadores.</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start justify-between gap-4">
                    <span className="text-fg">Productos con stock sin costo</span>
                    <span className="text-fg font-semibold tabular-nums">{int(s.skusWithoutCost)}</span>
                  </li>
                  <li className="flex items-start justify-between gap-4">
                    <span className="text-fg">Productos sin nivel de reorden</span>
                    <span className="text-fg font-semibold tabular-nums">{int(s.withoutReorderLevel)}</span>
                  </li>
                </ul>
                <Link
                  href="/dashboard/products"
                  className="text-accent focus-visible:outline-focus mt-4 inline-flex min-h-11 items-center rounded text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2"
                >
                  Completar datos de productos
                </Link>
              </Card>
            </div>

            {/* Definitions: every number is explainable */}
            <details className="border-line bg-surface rounded-2xl border p-4 sm:p-6">
              <summary className="text-fg focus-visible:outline-focus flex min-h-11 cursor-pointer items-center rounded font-semibold focus-visible:outline-2">
                Cómo se calculan estos indicadores
              </summary>
              <dl className="text-fg mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <Definition term="Valor del inventario">Σ stock × costo del producto. Productos sin costo no suman.</Definition>
                <Definition term="Faltantes con demanda">Stock en 0 y al menos un despacho en los últimos {WINDOW_DAYS} días.</Definition>
                <Definition term="Cobertura">Stock ÷ despacho diario promedio de los últimos {WINDOW_DAYS} días. En riesgo si es menor a {AT_RISK_DAYS} días.</Definition>
                <Definition term="Stock inmovilizado">Productos con stock sin ningún movimiento en {WINDOW_DAYS} días.</Definition>
                <Definition term="Rotación anualizada">Costo despachado en el período ÷ valor actual del inventario × 365 ÷ días del período. Aproximada: no hay histórico del valor promedio.</Definition>
                <Definition term="Ajustes sobre movimientos">Líneas de ajuste ÷ todas las líneas del período. Indicador aproximado de exactitud: cada ajuste corrige una diferencia entre el sistema y lo físico.</Definition>
                <Definition term="Movimientos">Incluyen productos dados de baja después; valor y listas solo incluyen productos activos.</Definition>
                <Definition term="Fuera de alcance">Despacho a tiempo, pedidos en riesgo, picking, muelles y conteos cíclicos requieren datos de pedidos, cortes y tareas que el sistema aún no registra.</Definition>
              </dl>
            </details>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function Definition({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold">{term}</dt>
      <dd className="text-fg-muted mt-0.5">{children}</dd>
    </div>
  );
}

function ActionList({
  title,
  empty,
  rows,
  columns,
}: {
  title: string;
  empty: string;
  rows: KpiRow[];
  columns: { label: string; value: (r: KpiRow) => string }[];
}) {
  return (
    <Card noPadding className="p-4">
      <h3 className="text-fg mb-2 font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-fg-muted text-sm">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="text-fg-muted">
              <tr>
                <th scope="col" className="py-2 pr-3 font-semibold">Producto</th>
                {columns.map((c) => (
                  <th key={c.label} scope="col" className="py-2 pl-3 text-right font-semibold whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-fg">
              {rows.map((r) => (
                <tr key={r.productId} className="border-line border-t">
                  <th scope="row" className="max-w-48 py-2 pr-3 font-medium">
                    <span className="line-clamp-2">{r.productName}</span>
                    {r.sku && r.sku !== "0" && <span className="text-fg-muted block text-xs">{r.sku}</span>}
                  </th>
                  {columns.map((c) => (
                    <td key={c.label} className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">
                      {c.value(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
