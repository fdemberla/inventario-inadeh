/**
 * Warehouse KPIs: formulas checked against hand-computed values, plus the
 * API's access control and input validation.
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/db", () => ({ rawSql: jest.fn() }));
jest.mock("@/lib/authz", () => ({ requireWarehouse: jest.fn() }));

import { rawSql } from "@/lib/db";
import { requireWarehouse } from "@/lib/authz";
import { getWarehouseKpis } from "@/lib/reports/kpis";
import { GET } from "@/app/api/reports/[id]/kpis/route";

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

// productFacts, movements, series, users — in the order getWarehouseKpis queries them
function mockQueries() {
  (rawSql as jest.Mock)
    .mockResolvedValueOnce([
      // A: 90 units shipped in 90 d (1/day), 5 in stock → 5 days of cover → at risk
      { ProductID: 1, ProductName: "A", InternalSKU: "A1", Cost: 2, QuantityOnHand: 5, ReorderLevel: null, Shipped90: 90, LastMovement: daysAgo(1) },
      // B: out of stock with demand → stockout
      { ProductID: 2, ProductName: "B", InternalSKU: "B1", Cost: 10, QuantityOnHand: 0, ReorderLevel: 3, Shipped90: 9, LastMovement: daysAgo(2) },
      // C: stock, no movement for 200 d → idle; no cost → excluded from value
      { ProductID: 3, ProductName: "C", InternalSKU: null, Cost: null, QuantityOnHand: 7, ReorderLevel: null, Shipped90: 0, LastMovement: daysAgo(200) },
      // D: plenty of stock, slow demand → healthy (900 days of cover)
      { ProductID: 4, ProductName: "D", InternalSKU: "D1", Cost: 1, QuantityOnHand: 900, ReorderLevel: 5, Shipped90: 90, LastMovement: daysAgo(3) },
    ])
    .mockResolvedValueOnce([
      { Type: "RECEIPT", Lines: 6, NetUnits: 60, AbsValue: 100 },
      { Type: "SHIPMENT", Lines: 3, NetUnits: -30, AbsValue: 91 },
      { Type: "ADJUSTMENT", Lines: 1, NetUnits: -2, AbsValue: 4 },
    ])
    .mockResolvedValueOnce([{ Bucket: "2026-11-01", Receipts: 60, Shipments: 30 }])
    .mockResolvedValueOnce([{ UserName: "ana", Receipts: 6, Shipments: 3, Adjustments: 1 }]);
}

describe("getWarehouseKpis formulas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueries();
  });

  it("computes value, coverage, stockouts, idle and data-quality counts", async () => {
    const k = await getWarehouseKpis(1, 30, null);
    // value = 5×2 + 7×0 (no cost) + 900×1 = 910
    expect(k.summary.stockValue).toBe(910);
    expect(k.summary.skusWithStock).toBe(3);
    expect(k.summary.skusWithoutCost).toBe(1);
    expect(k.stockouts.map((r) => r.productId)).toEqual([2]);
    expect(k.atRisk.map((r) => r.productId)).toEqual([1]);
    expect(k.atRisk[0].coverDays).toBeCloseTo(5);
    expect(k.idle.map((r) => r.productId)).toEqual([3]);
    expect(k.summary.withoutReorderLevel).toBe(2);
  });

  it("computes flow KPIs for the period", async () => {
    const k = await getWarehouseKpis(1, 30, null);
    expect(k.summary.receipts).toEqual({ lines: 6, units: 60 });
    expect(k.summary.shipments).toEqual({ lines: 3, units: 30, cost: 91 });
    // 1 adjustment line out of 10
    expect(k.summary.adjustmentShare).toBeCloseTo(0.1);
    // turnover = 91 / 910 × 365/30
    expect(k.summary.turnover).toBeCloseTo((91 / 910) * (365 / 30));
    expect(k.series.granularity).toBe("day");
    // every day of the period, zeros included (+1 if the fixed fixture date
    // falls outside the window when this test runs on a later date)
    expect(k.series.points.length).toBeGreaterThanOrEqual(30);
    expect(k.series.points.length).toBeLessThanOrEqual(31);
    expect(k.series.points).toContainEqual({ bucket: "2026-11-01", receipts: 60, shipments: 30 });
  });

  it("uses weekly buckets for long periods and passes params safely", async () => {
    const k = await getWarehouseKpis(7, 365, 12);
    expect(k.series.granularity).toBe("week");
    for (const call of (rawSql as jest.Mock).mock.calls) {
      expect(call[0]).not.toMatch(/\b12\b/); // category travels as a parameter, not in SQL text
    }
    expect((rawSql as jest.Mock).mock.calls[1][1]).toEqual([7, 365, 12]);
  });

  it("returns null ratios when there is no stock value or no movements", async () => {
    (rawSql as jest.Mock).mockReset();
    (rawSql as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const k = await getWarehouseKpis(1, 30, null);
    expect(k.summary.turnover).toBeNull();
    expect(k.summary.adjustmentShare).toBeNull();
  });
});

describe("GET /api/reports/:id/kpis", () => {
  const call = (qs: string, id = "5") =>
    GET(new NextRequest(`http://localhost:3000/api/reports/${id}/kpis${qs}`), {
      params: Promise.resolve({ id }),
    });

  beforeEach(() => jest.clearAllMocks());

  it("is warehouse-scoped (403 from the guard is returned as-is)", async () => {
    const { NextResponse } = await import("next/server");
    (requireWarehouse as jest.Mock).mockResolvedValue({
      error: NextResponse.json({ message: "No tienes permiso" }, { status: 403 }),
    });
    const res = await call("?days=30");
    expect(res.status).toBe(403);
    expect(rawSql).not.toHaveBeenCalled();
  });

  it.each(["?days=12", "?days=abc", "?days=30&category=1;DROP"])("rejects %s with 400", async (qs) => {
    (requireWarehouse as jest.Mock).mockResolvedValue({ user: { id: 1, role: 1 } });
    const res = await call(qs);
    expect(res.status).toBe(400);
  });

  it("returns KPIs for an allowed warehouse", async () => {
    (requireWarehouse as jest.Mock).mockResolvedValue({ user: { id: 1, role: 1 } });
    mockQueries();
    const res = await call("?days=30&category=todas");
    expect(res.status).toBe(200);
    expect((await res.json()).summary.stockValue).toBe(910);
  });
});

describe("fillBuckets", () => {
  const { fillBuckets } = jest.requireActual("@/lib/reports/kpis") as typeof import("@/lib/reports/kpis");
  const now = Date.UTC(2026, 10, 23, 15); // Mon 23 Nov 2026

  it("fills every day of a short period with zeros", () => {
    const pts = fillBuckets([{ bucket: "2026-11-20", receipts: 5, shipments: 1 }], 7, now);
    expect(pts).toHaveLength(7);
    expect(pts[0].bucket).toBe("2026-11-17");
    expect(pts.at(-1)!.bucket).toBe("2026-11-23");
    expect(pts.find((p) => p.bucket === "2026-11-20")).toMatchObject({ receipts: 5 });
    expect(pts.filter((p) => p.receipts === 0)).toHaveLength(6);
  });

  it("uses consecutive Monday weeks for long periods (no gaps)", () => {
    const pts = fillBuckets([{ bucket: "2026-11-16", receipts: 1, shipments: 1 }], 90, now);
    const gaps = pts.slice(1).map((p, i) => (Date.parse(p.bucket) - Date.parse(pts[i].bucket)) / 86_400_000);
    expect(new Set(gaps)).toEqual(new Set([7]));
    expect(pts.every((p) => new Date(p.bucket).getUTCDay() === 1)).toBe(true);
    expect(pts.find((p) => p.bucket === "2026-11-16")).toMatchObject({ receipts: 1 });
  });
});
