import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id);
  const body = await req.json();
  const { WarehouseName, Location, IsActive } = body;

  const sqlParams = [WarehouseName, Location, IsActive, id];

  await sql(
    `
    UPDATE Warehouses SET
      WarehouseName = @param0,
      Location = @param1,
      IsActive = @param2,
      ModifiedDate = SYSUTCDATETIME()
    WHERE WarehouseID = @param3
  `,
    sqlParams,
  );

  return NextResponse.json({ message: "Warehouse updated" });
}
