// app/api/warehouses/mobile/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rawSql } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    // Get user from mobile Bearer token
    const session = await getMobileSession(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Query warehouses assigned to this user
    const query = `SELECT w.WarehouseID, w.WarehouseCode, rl.Name, rl.ShortName, 
      w.WarehouseName, CONCAT(w.WarehouseCode, ' - ', rl.Name, ' - ', w.WarehouseName) AS NombreWarehouse
      FROM dbo.WarehouseUsers wu
      INNER JOIN dbo.Warehouses w ON wu.WarehouseID = w.WarehouseID
      INNER JOIN dbo.RegionalLocations rl ON w.MainLocationID = rl.MainLocationID
      WHERE wu.UserID = @param0`;

    const warehouses = await rawSql(query, [session.id]);

    return NextResponse.json({
      success: true,
      warehouses,
    });
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}

// Reject other methods
export async function POST() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 },
  );
}
