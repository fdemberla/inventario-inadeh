import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  try {
    const { id: idParam } = await context.params;
    if (!/^\d+$/.test(idParam)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }
    const id = parseInt(idParam, 10);

    const body = await req.json();
    const { WarehouseName, Location, IsActive } = body;

    if (!WarehouseName || String(WarehouseName).trim() === "") {
      return NextResponse.json(
        { message: "El nombre del depósito es requerido" },
        { status: 400 },
      );
    }

    await sql(
      `
      UPDATE Warehouses SET
        WarehouseName = @param0,
        Location = @param1,
        IsActive = @param2,
        ModifiedDate = SYSUTCDATETIME()
      WHERE WarehouseID = @param3
    `,
      [String(WarehouseName).trim(), Location ?? null, IsActive ? 1 : 0, id],
    );

    return NextResponse.json({ message: "Warehouse updated" });
  } catch (error) {
    console.error("Error updating warehouse:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
