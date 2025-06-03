import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params; // Await here

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
