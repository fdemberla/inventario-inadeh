import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id);

  try {
    // Get user info
    const userResult = await sql(
      `
      SELECT 
        U.UserID,
        U.Username,
        U.FirstName,
        U.LastName,
        U.Email,
        U.Phone,
        U.IsActive,
        U.RoleID,
        R.RoleName
      FROM inventario.dbo.Users U
      INNER JOIN inventario.dbo.Roles R ON U.RoleID = R.RoleID
      WHERE U.UserID = @param0
      `,
      [id],
    );

    if (userResult.recordset.length === 0) {
      return NextResponse.json(
        { message: "Usuario no encontrado." },
        { status: 404 },
      );
    }

    const user = userResult.recordset[0];

    // Get assigned warehouses
    const warehouseResult = await sql(
      `
      SELECT 
        W.WarehouseID,
        W.WarehouseCode,
        W.WarehouseName,
        W.Location
      FROM inventario.dbo.Warehouses W
      INNER JOIN inventario.dbo.WarehouseUsers UW ON W.WarehouseID = UW.WarehouseID
      WHERE UW.UserID = @param0
      `,
      [id],
    );

    user.Warehouses = warehouseResult.recordset;

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Error al obtener el usuario." },
      { status: 500 },
    );
  }
}
