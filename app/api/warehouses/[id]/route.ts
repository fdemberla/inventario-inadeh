import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireWarehouse } from "@/lib/authz";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params; // Await here
  const guard = await requireWarehouse(request, id);
  if (guard.error) return guard.error;

  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  const result = await sql(
    `SELECT WarehouseID, WarehouseCode, WarehouseName, Location, IsActive, CreatedDate, ModifiedDate, MainLocationID FROM Warehouses WHERE WarehouseID = @param0`,
    [numericId],
  );

  if (result.recordset.length === 0) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ warehouse: result.recordset[0] });
}
