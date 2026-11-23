/**
 * A01 Broken Access Control: role and warehouse guards on API routes.
 * DB and auth are mocked; these tests only check who is allowed through.
 */
import { NextRequest } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { canAccessWarehouse } from "@/lib/permissions";
import { rawSql, sql } from "@/lib/db";

jest.mock("@/lib/api-auth", () => ({
  getApiAuth: jest.fn(),
  isAdmin: (u: { role: number }) => u.role === 1,
}));
jest.mock("@/lib/permissions", () => ({ canAccessWarehouse: jest.fn() }));
jest.mock("@/lib/db", () => ({
  rawSql: jest.fn().mockResolvedValue([]),
  sql: jest.fn().mockResolvedValue({ recordset: [] }),
  withTransaction: jest.fn(),
}));
jest.mock("@/auth", () => ({ auth: jest.fn() }));

import { PUT as updateUser } from "@/app/api/users/[id]/update/route";
import { POST as createUser } from "@/app/api/users/create/route";
import { GET as listUsers } from "@/app/api/users/route";
import { GET as listRoles } from "@/app/api/roles/route";
import { POST as createWarehouse } from "@/app/api/warehouses/create/route";
import { PUT as updateWarehouse } from "@/app/api/warehouses/[id]/update/route";
import { PUT as updateCategory } from "@/app/api/categories/[id]/update/route";
import { DELETE as deleteProduct } from "@/app/api/products/[id]/route";
import { POST as updateInventory } from "@/app/api/inventory/update/route";
import { GET as getInventory } from "@/app/api/inventory/[id]/route";
import { POST as webScan } from "@/app/api/inventory/scanner/route";
import { POST as webSync } from "@/app/api/inventory/scanner/sync/route";
import { POST as mobileScan } from "@/app/api/inventory/scanner/mobile/scan/route";
import { GET as nivelesReport } from "@/app/api/reports/[id]/niveles/route";
import { PUT as updateUnit } from "@/app/api/units/[id]/update/route";

const ADMIN = { id: 1, role: 1, username: "admin" };
const GENERAL = { id: 2, role: 2, username: "operador" };

const asUser = (user: object | null) =>
  (getApiAuth as jest.Mock).mockResolvedValue({ user, authMethod: "web" });

const req = (url: string, method = "GET", body?: unknown) =>
  new NextRequest(`http://localhost:3000${url}`, {
    method,
    ...(body !== undefined && {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  });

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  jest.clearAllMocks();
  (rawSql as jest.Mock).mockResolvedValue([]);
  (sql as jest.Mock).mockResolvedValue({ recordset: [] });
});

describe("Admin-only routes reject GENERAL users (403) and anonymous (401)", () => {
  const cases: [string, () => Promise<Response>][] = [
    ["PUT users/:id/update (privilege escalation)", () =>
      updateUser(req("/api/users/1/update", "PUT", { Username: "x", RoleID: 1 }))],
    ["POST users/create", () =>
      createUser(req("/api/users/create", "POST", { Username: "x", Password: "y", RoleID: 1 }))],
    ["GET users", () => listUsers(req("/api/users"))],
    ["GET roles", () => listRoles(req("/api/roles"))],
    ["POST warehouses/create", () =>
      createWarehouse(req("/api/warehouses/create", "POST", { WarehouseName: "x", MainLocationID: 1 }))],
    ["PUT warehouses/:id/update", () =>
      updateWarehouse(req("/api/warehouses/1/update", "PUT", { WarehouseName: "x" }), params("1"))],
    ["PUT categories/:id/update", () =>
      updateCategory(req("/api/categories/1/update", "PUT", { categoryName: "x" }), params("1"))],
    ["DELETE products/:id", () =>
      deleteProduct(req("/api/products/1", "DELETE"), params("1"))],
    ["PUT units/:id/update", () =>
      updateUnit(req("/api/units/1/update", "PUT", { UnitName: "x" }), params("1"))],
  ];

  it.each(cases)("%s → 403 for GENERAL", async (_, call) => {
    asUser(GENERAL);
    const res = await call();
    expect(res.status).toBe(403);
    expect(sql).not.toHaveBeenCalled();
  });

  it.each(cases)("%s → 401 when not authenticated", async (_, call) => {
    asUser(null);
    const res = await call();
    expect(res.status).toBe(401);
  });

  it("admin can update a user", async () => {
    asUser(ADMIN);
    const res = await updateUser(
      req("/api/users/5/update", "PUT", { Username: "x", RoleID: 2 }),
    );
    expect(res.status).toBe(200);
  });
});

describe("Unit editing", () => {
  const put = (body: object) =>
    updateUnit(req("/api/units/3/update", "PUT", body), params("3"));

  beforeEach(() => asUser(ADMIN));

  it("refuses to edit standard (non-custom) units", async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce([{ System: "Métrico" }]);
    const res = await put({ UnitName: "Kilo" });
    expect(res.status).toBe(409);
    expect(rawSql).toHaveBeenCalledTimes(1); // no UPDATE issued
  });

  it("updates a custom unit", async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce([{ System: "Personalizado" }]);
    const res = await put({ UnitName: " Caja ", Abbreviation: "cj" });
    expect(res.status).toBe(200);
    expect((rawSql as jest.Mock).mock.calls[1][1]).toEqual(["Caja", "cj", 3]);
  });

  it("rejects an empty name", async () => {
    const res = await put({ UnitName: "  " });
    expect(res.status).toBe(400);
  });
});

describe("Warehouse-scoped routes reject foreign warehouses (403)", () => {
  beforeEach(() => {
    asUser(GENERAL);
    (canAccessWarehouse as jest.Mock).mockResolvedValue(false);
  });

  it("POST inventory/update", async () => {
    const res = await updateInventory(
      req("/api/inventory/update", "POST", {
        productId: 1, warehouseId: 99, newQuantity: 5, updateType: "table",
      }),
    );
    expect(res.status).toBe(403);
    expect(rawSql).not.toHaveBeenCalled();
  });

  it("GET inventory/:warehouseId", async () => {
    const res = await getInventory(req("/api/inventory/99"), params("99"));
    expect(res.status).toBe(403);
  });

  it("POST inventory/scanner", async () => {
    const res = await webScan(
      req("/api/inventory/scanner", "POST", {
        barcode: "123", warehouseId: 99, operation: "salida",
      }),
    );
    expect(res.status).toBe(403);
    expect(rawSql).not.toHaveBeenCalled();
  });

  it("POST inventory/scanner/mobile/scan", async () => {
    const res = await mobileScan(
      req("/api/inventory/scanner/mobile/scan", "POST", {
        barcode: "123", warehouseId: 99, operation: "entrada",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("GET reports/:id/niveles", async () => {
    const res = await nivelesReport(req("/api/reports/99/niveles"), params("99") as never);
    expect(res.status).toBe(403);
  });

  it("POST inventory/scanner/sync marks foreign scans as forbidden", async () => {
    const res = await webSync(
      req("/api/inventory/scanner/sync", "POST", {
        deviceId: "d",
        scans: [{ id: 1, barcode: "1", warehouseId: 99, operation: "entrada", quantity: 1 }],
      }),
    );
    const json = await res.json();
    expect(json.results[0]).toMatchObject({ success: false, conflictType: "forbidden" });
    expect(rawSql).not.toHaveBeenCalled();
  });
});

describe("Input validation on stock changes", () => {
  beforeEach(() => {
    asUser(GENERAL);
    (canAccessWarehouse as jest.Mock).mockResolvedValue(true);
  });

  it.each([-1, 1.5, "5"])("inventory/update rejects newQuantity=%p", async (q) => {
    const res = await updateInventory(
      req("/api/inventory/update", "POST", {
        productId: 1, warehouseId: 1, newQuantity: q, updateType: "table",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("inventory/update rejects duplicate insert for existing product+warehouse", async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce([{ InventoryID: 7 }]);
    const res = await updateInventory(
      req("/api/inventory/update", "POST", {
        productId: 1, warehouseId: 1, newQuantity: 5, updateType: "insert",
      }),
    );
    expect(res.status).toBe(409);
  });

  it("inventory/update ignores client-supplied createdBy", async () => {
    (rawSql as jest.Mock)
      .mockResolvedValueOnce([{ InventoryID: 7, QuantityOnHand: 3 }])
      .mockResolvedValueOnce([{ Status: "SUCCESS" }]);
    await updateInventory(
      req("/api/inventory/update", "POST", {
        productId: 1, warehouseId: 1, newQuantity: 0, updateType: "table",
        createdBy: "someone_else",
      }),
    );
    const params = (rawSql as jest.Mock).mock.calls[1][1];
    expect(params).toContain("operador");
    expect(params).not.toContain("someone_else");
  });

  it("sync rejects negative 'entrada' quantities", async () => {
    const res = await webSync(
      req("/api/inventory/scanner/sync", "POST", {
        deviceId: "d",
        scans: [{ id: 1, barcode: "1", warehouseId: 1, operation: "entrada", quantity: -500 }],
      }),
    );
    const json = await res.json();
    expect(json.results[0]).toMatchObject({ success: false, conflictType: "invalid" });
  });
});
