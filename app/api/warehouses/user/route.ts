import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth_new";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = getUserFromToken(req);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const isUserAdmin = user.role == 1 ? true : false;

    let getWarehouseQuery = `SELECT w.WarehouseID, w.WarehouseCode, rl.Name, rl.ShortName, w.WarehouseName, CONCAT(w.WarehouseCode, ' - ', rl.Name, ' - ', w.WarehouseName) AS NombreWarehouse
FROM dbo.WarehouseUsers wu
INNER JOIN dbo.Warehouses w ON wu.WarehouseID = w.WarehouseID
INNER JOIN dbo.RegionalLocations rl ON w.MainLocationID = rl.MainLocationID
WHERE wu.UserID = @param0;`;

    if (!isUserAdmin) {
      getWarehouseQuery = `SELECT w.WarehouseID, w.WarehouseCode, rl.Name, rl.ShortName, w.WarehouseName, CONCAT(w.WarehouseCode, ' - ', rl.Name, ' - ', w.WarehouseName) AS NombreWarehouse
FROM dbo.WarehouseUsers wu
INNER JOIN dbo.Warehouses w ON wu.WarehouseID = w.WarehouseID
INNER JOIN dbo.RegionalLocations rl ON w.MainLocationID = rl.MainLocationID
WHERE wu.UserID = @param0;`;
    }

    const warehouses = await sql(getWarehouseQuery, [user.id]);

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("Error fetching user warehouses:", error);
    return NextResponse.json(
      { message: "Error interno del servidor", user: user },

      { status: 500 },
    );
  }
}
