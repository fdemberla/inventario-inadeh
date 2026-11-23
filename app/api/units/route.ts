import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getApiAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getApiAuth(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }
    const result = await sql(
      `
      SELECT UnitID, UnitName, Abbreviation, System
      FROM UnitsOfMeasurement
      ORDER BY System, UnitName ASC
    `,
      [],
    );

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { message: "Error al obtener las unidades de medida." },
      { status: 500 },
    );
  }
}
