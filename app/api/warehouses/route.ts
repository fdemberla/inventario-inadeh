import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
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
