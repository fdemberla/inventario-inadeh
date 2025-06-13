import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql(
      `
      SELECT 
        U.UserID,
        U.FirstName,
        U.LastName,
        U.Email,
        U.IsActive,
        R.RoleName
      FROM dbo.Users U
      INNER JOIN dbo.Roles R ON U.RoleID = R.RoleID
      ORDER BY U.FirstName, U.LastName
      `,
      [],
    );

    return NextResponse.json({ users: result.recordset });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error al obtener los usuarios." },
      { status: 500 },
    );
  }
}
