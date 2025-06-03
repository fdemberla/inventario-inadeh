import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
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
