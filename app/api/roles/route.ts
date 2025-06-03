import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql(
      `SELECT RoleID, RoleName, Description, CreatedDate, ModifiedDate FROM inventario.dbo.Roles;`,
      [],
    );

    return NextResponse.json({ roles: result.recordset });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error al obtener los usuarios." },
      { status: 500 },
    );
  }
}
