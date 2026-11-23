import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const id = parseInt(params.id);

  // Validate ID format
  if (isNaN(id) || id <= 0) {
    return NextResponse.json(
      { message: "ID de usuario inválido." },
      { status: 400 },
    );
  }

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
      FROM dbo.Users U
      INNER JOIN dbo.Roles R ON U.RoleID = R.RoleID
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
      FROM dbo.Warehouses W
      INNER JOIN dbo.WarehouseUsers UW ON W.WarehouseID = UW.WarehouseID
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
