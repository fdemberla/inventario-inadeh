// lib/reports/kpis.ts
// Warehouse KPIs computable from the data this WMS records today: stock per
// warehouse (Inventory) and RECEIPT / SHIPMENT / ADJUSTMENT movements
// (InventoryTransactions). There are no orders, cut-off times, docks, tasks or
// counts, so dispatch/picking/dock KPIs are intentionally not computed here.
import { rawSql } from "@/lib/db";

/** Window used to estimate demand (coverage) and idle stock, independent of the period. */
export const DEMAND_WINDOW_DAYS = 90;
export const AT_RISK_COVER_DAYS = 14;
export const IDLE_DAYS = 90;
export const ALLOWED_PERIODS = [7, 30, 90, 365] as const;

export interface KpiSummary {
  periodDays: number;
  stockValue: number;
  skusWithStock: number;
  skusWithoutCost: number;
  receipts: { lines: number; units: number };
  shipments: { lines: number; units: number; cost: number };
  adjustments: { lines: number; netUnits: number; absValue: number };
  /** adjustment lines / all lines in the period (0–1), null when no movements */
  adjustmentShare: number | null;
  /** annualised: shipped cost in period / current stock value × 365 / days */
  turnover: number | null;
  stockoutsWithDemand: number;
  atRisk: number;
  idleValue: number;
  idleSkus: number;
  withoutReorderLevel: number;
}

export interface KpiRow {
  productId: number;
  productName: string;
  sku: string | null;
  quantity: number;
  unitCost: number | null;
  shipped90: number;
  dailyDemand: number;
  coverDays: number | null;
  lastMovement: string | null;
}

export interface SeriesPoint {
  bucket: string; // yyyy-MM-dd (day) or week start
  receipts: number;
  shipments: number;
}

export interface UserActivity {
  user: string;
  receipts: number;
  shipments: number;
  adjustments: number;
}

export interface WarehouseKpis {
  summary: KpiSummary;
  stockouts: KpiRow[];
  atRisk: KpiRow[];
  idle: KpiRow[];
  series: { granularity: "day" | "week"; points: SeriesPoint[] };
  users: UserActivity[];
  generatedAt: string;
}

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

const DAY_MS = 86_400_000;
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

/**
 * Every day (≤ 31-day periods) or every week (Monday, matching SQL Server's
 * DATEADD(week, DATEDIFF(week, 0, d), 0)) in the period, with zeros where
 * nothing moved — otherwise the time axis silently skips idle stretches.
 */
export function fillBuckets(points: SeriesPoint[], periodDays: number, now: number): SeriesPoint[] {
  const byKey = new Map(points.map((p) => [p.bucket, p]));
  const today = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  );
  const keys: string[] = [];
  if (periodDays <= 31) {
    for (let t = today - (periodDays - 1) * DAY_MS; t <= today; t += DAY_MS) keys.push(isoDay(t));
  } else {
    const monday = (t: number) => t - ((new Date(t).getUTCDay() + 6) % 7) * DAY_MS;
    for (let t = monday(today - periodDays * DAY_MS); t <= today; t += 7 * DAY_MS) keys.push(isoDay(t));
  }
  const filled = keys.map((k) => byKey.get(k) ?? { bucket: k, receipts: 0, shipments: 0 });
  // Keep any bucket the DB returned that falls outside the generated range
  for (const p of points) if (!keys.includes(p.bucket)) filled.push(p);
  return filled.sort((a, b) => a.bucket.localeCompare(b.bucket));
}

/**
 * Per-product facts for one warehouse (optionally one category). Every list
 * and most tiles derive from this single result set, so they always agree.
 */
async function productFacts(warehouseId: number, categoryId: number | null) {
  return (await rawSql(
    `
    SELECT
      p.ProductID, p.ProductName, p.InternalSKU, p.Cost,
      i.QuantityOnHand, i.ReorderLevel,
      ISNULL(-SUM(CASE WHEN t.TransactionType = 'SHIPMENT'
                        AND t.CreatedDate >= DATEADD(day, -@param1, SYSDATETIME())
                       THEN t.QuantityChange END), 0) AS Shipped90,
      MAX(t.CreatedDate) AS LastMovement
    FROM dbo.Inventory i
    JOIN dbo.Products p ON p.ProductID = i.ProductID
    LEFT JOIN dbo.InventoryTransactions t ON t.InventoryID = i.InventoryID
    WHERE i.WarehouseID = @param0
      AND p.IsActive = 1
      AND (@param2 IS NULL OR p.CategoryID = @param2)
    GROUP BY p.ProductID, p.ProductName, p.InternalSKU, p.Cost, i.QuantityOnHand, i.ReorderLevel
    `,
    [warehouseId, DEMAND_WINDOW_DAYS, categoryId],
  )) as {
    ProductID: number;
    ProductName: string;
    InternalSKU: string | null;
    Cost: number | null;
    QuantityOnHand: number;
    ReorderLevel: number | null;
    Shipped90: number;
    LastMovement: string | Date | null;
  }[];
}

export async function getWarehouseKpis(
  warehouseId: number,
  periodDays: number,
  categoryId: number | null,
): Promise<WarehouseKpis> {
  const [facts, movementRows, seriesRows, userRows] = await Promise.all([
    productFacts(warehouseId, categoryId),
    rawSql(
      `
      SELECT t.TransactionType AS Type,
             COUNT(*) AS Lines,
             SUM(t.QuantityChange) AS NetUnits,
             SUM(ABS(t.QuantityChange) * ISNULL(p.Cost, 0)) AS AbsValue
      FROM dbo.InventoryTransactions t
      JOIN dbo.Inventory i ON i.InventoryID = t.InventoryID
      JOIN dbo.Products p ON p.ProductID = i.ProductID
      WHERE i.WarehouseID = @param0
        AND t.CreatedDate >= DATEADD(day, -@param1, SYSDATETIME())
        AND (@param2 IS NULL OR p.CategoryID = @param2)
      GROUP BY t.TransactionType
      `,
      [warehouseId, periodDays, categoryId],
    ) as Promise<{ Type: string; Lines: number; NetUnits: number; AbsValue: number }[]>,
    rawSql(
      `
      SELECT ${periodDays > 31
        ? "DATEADD(week, DATEDIFF(week, 0, t.CreatedDate), 0)"
        : "CAST(t.CreatedDate AS date)"} AS Bucket,
             SUM(CASE WHEN t.TransactionType = 'RECEIPT' THEN t.QuantityChange ELSE 0 END) AS Receipts,
             -SUM(CASE WHEN t.TransactionType = 'SHIPMENT' THEN t.QuantityChange ELSE 0 END) AS Shipments
      FROM dbo.InventoryTransactions t
      JOIN dbo.Inventory i ON i.InventoryID = t.InventoryID
      JOIN dbo.Products p ON p.ProductID = i.ProductID
      WHERE i.WarehouseID = @param0
        AND t.CreatedDate >= DATEADD(day, -@param1, SYSDATETIME())
        AND (@param2 IS NULL OR p.CategoryID = @param2)
      GROUP BY ${periodDays > 31
        ? "DATEADD(week, DATEDIFF(week, 0, t.CreatedDate), 0)"
        : "CAST(t.CreatedDate AS date)"}
      ORDER BY Bucket
      `,
      [warehouseId, periodDays, categoryId],
    ) as Promise<{ Bucket: string | Date; Receipts: number; Shipments: number }[]>,
    rawSql(
      `
      SELECT ISNULL(NULLIF(LTRIM(RTRIM(t.CreatedBy)), ''), '(sin usuario)') AS UserName,
             SUM(CASE WHEN t.TransactionType = 'RECEIPT' THEN 1 ELSE 0 END) AS Receipts,
             SUM(CASE WHEN t.TransactionType = 'SHIPMENT' THEN 1 ELSE 0 END) AS Shipments,
             SUM(CASE WHEN t.TransactionType = 'ADJUSTMENT' THEN 1 ELSE 0 END) AS Adjustments
      FROM dbo.InventoryTransactions t
      JOIN dbo.Inventory i ON i.InventoryID = t.InventoryID
      JOIN dbo.Products p ON p.ProductID = i.ProductID
      WHERE i.WarehouseID = @param0
        AND t.CreatedDate >= DATEADD(day, -@param1, SYSDATETIME())
        AND (@param2 IS NULL OR p.CategoryID = @param2)
      GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(t.CreatedBy)), ''), '(sin usuario)')
      ORDER BY COUNT(*) DESC
      `,
      [warehouseId, periodDays, categoryId],
    ) as Promise<{ UserName: string; Receipts: number; Shipments: number; Adjustments: number }[]>,
  ]);

  // ---- per-product derived values
  const now = Date.now();
  const idleCutoff = now - IDLE_DAYS * 86_400_000;
  const rows: KpiRow[] = facts.map((f) => {
    const shipped90 = num(f.Shipped90);
    const dailyDemand = shipped90 / DEMAND_WINDOW_DAYS;
    const quantity = num(f.QuantityOnHand);
    return {
      productId: f.ProductID,
      productName: f.ProductName,
      sku: f.InternalSKU,
      quantity,
      unitCost: f.Cost === null ? null : Number(f.Cost),
      shipped90,
      dailyDemand,
      coverDays: dailyDemand > 0 ? quantity / dailyDemand : null,
      lastMovement: f.LastMovement ? new Date(f.LastMovement).toISOString() : null,
    };
  });

  const withStock = rows.filter((r) => r.quantity > 0);
  const stockValue = withStock.reduce((s, r) => s + r.quantity * (r.unitCost ?? 0), 0);
  const stockouts = rows
    .filter((r) => r.quantity <= 0 && r.shipped90 > 0)
    .sort((a, b) => b.shipped90 - a.shipped90);
  const atRisk = rows
    .filter((r) => r.quantity > 0 && r.coverDays !== null && r.coverDays < AT_RISK_COVER_DAYS)
    .sort((a, b) => (a.coverDays ?? 0) - (b.coverDays ?? 0));
  const idle = withStock
    .filter((r) => !r.lastMovement || new Date(r.lastMovement).getTime() < idleCutoff)
    .sort((a, b) => b.quantity * (b.unitCost ?? 0) - a.quantity * (a.unitCost ?? 0));
  const idleValue = idle.reduce((s, r) => s + r.quantity * (r.unitCost ?? 0), 0);

  // ---- movements in the period
  const byType = Object.fromEntries(movementRows.map((m) => [m.Type, m]));
  const receipts = byType.RECEIPT;
  const shipments = byType.SHIPMENT;
  const adjustments = byType.ADJUSTMENT;
  const totalLines = movementRows.reduce((s, m) => s + num(m.Lines), 0);
  const shippedCost = num(shipments?.AbsValue);

  const summary: KpiSummary = {
    periodDays,
    stockValue,
    skusWithStock: withStock.length,
    skusWithoutCost: withStock.filter((r) => r.unitCost === null || r.unitCost <= 0).length,
    receipts: { lines: num(receipts?.Lines), units: num(receipts?.NetUnits) },
    shipments: { lines: num(shipments?.Lines), units: -num(shipments?.NetUnits), cost: shippedCost },
    adjustments: {
      lines: num(adjustments?.Lines),
      netUnits: num(adjustments?.NetUnits),
      absValue: num(adjustments?.AbsValue),
    },
    adjustmentShare: totalLines > 0 ? num(adjustments?.Lines) / totalLines : null,
    turnover: stockValue > 0 ? (shippedCost / stockValue) * (365 / periodDays) : null,
    stockoutsWithDemand: stockouts.length,
    atRisk: atRisk.length,
    idleValue,
    idleSkus: idle.length,
    withoutReorderLevel: facts.filter((f) => f.ReorderLevel === null).length,
  };

  return {
    summary,
    stockouts: stockouts.slice(0, 10),
    atRisk: atRisk.slice(0, 10),
    idle: idle.slice(0, 10),
    series: {
      granularity: periodDays > 31 ? "week" : "day",
      points: fillBuckets(
        seriesRows.map((s) => ({
          bucket: new Date(s.Bucket).toISOString().slice(0, 10),
          receipts: num(s.Receipts),
          shipments: num(s.Shipments),
        })),
        periodDays,
        now,
      ),
    },
    users: userRows.map((u) => ({
      user: u.UserName,
      receipts: num(u.Receipts),
      shipments: num(u.Shipments),
      adjustments: num(u.Adjustments),
    })),
    generatedAt: new Date(now).toISOString(),
  };
}
