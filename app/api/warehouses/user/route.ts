import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  try {
    const isUserAdmin = user.role === USER_ROLES.ADMIN;

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
