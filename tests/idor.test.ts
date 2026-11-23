import { GET } from "../app/api/reports/[id]/valor/route";
import { NextRequest } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { canAccessWarehouse } from "@/lib/permissions";

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  getApiAuth: jest.fn(),
}));

jest.mock("@/lib/permissions", () => ({
  canAccessWarehouse: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  rawSql: jest.fn().mockResolvedValue([]), // Mock DB to return empty to prevent real SQL queries
}));

describe("A01: IDOR Protection on Reports API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 si no hay usuario autenticado", async () => {
    (getApiAuth as jest.Mock).mockResolvedValue({ user: null });

    const req = new NextRequest("http://localhost:3000/api/reports/1/valor");
    const response = await GET(req, { params: { id: "1" } });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.message).toBe("No autorizado");
  });

  it("should return 403 Forbidden if a standard user tries to access a warehouse they don't own", async () => {
    // 1. Mock standard user
    (getApiAuth as jest.Mock).mockResolvedValue({
      user: { id: 2, role: 2, username: "standard_user" }
    });

    // 2. Mock IDOR failure (warehouse 999 is not theirs)
    (canAccessWarehouse as jest.Mock).mockResolvedValue(false);

    const req = new NextRequest("http://localhost:3000/api/reports/999/valor");
    const response = await GET(req, { params: { id: "999" } });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.message).toBe("No tienes permiso para ver esta bodega");
  });

  it("should allow access (200 OK) if the standard user is assigned to the warehouse", async () => {
    // 1. Mock standard user
    (getApiAuth as jest.Mock).mockResolvedValue({
      user: { id: 2, role: 2, username: "standard_user" }
    });

    // 2. Mock IDOR success (warehouse 1 is theirs)
    (canAccessWarehouse as jest.Mock).mockResolvedValue(true);

    const req = new NextRequest("http://localhost:3000/api/reports/1/valor");
    const response = await GET(req, { params: { id: "1" } });

    expect(response.status).toBe(200);
  });
});
