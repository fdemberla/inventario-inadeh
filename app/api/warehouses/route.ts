import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  try {
    const result = await sql(
      `SELECT WarehouseID, WarehouseCode, WarehouseName, RL.Name, RL.Address, Location, IsActive, CreatedDate, ModifiedDate, W.MainLocationID
        FROM dbo.Warehouses W
        INNER JOIN dbo.RegionalLocations RL
        ON W.MainLocationID = RL.MainLocationID;`,
      [],
    );
    return NextResponse.json({ warehouses: result });
  } catch (error) {
    console.error("Failed to fetch warehouses:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
