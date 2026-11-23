import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  try {
    const result = await sql(
      `SELECT RoleID, RoleName, Description, CreatedDate, ModifiedDate FROM dbo.Roles;`,
      [],
    );

    return NextResponse.json({ roles: result.recordset });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { message: "Error al obtener los roles." },
      { status: 500 },
    );
  }
}
