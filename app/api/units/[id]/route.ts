import { NextRequest, NextResponse } from "next/server";
import { rawSql } from "@/lib/db";
import { requireUser } from "@/lib/authz";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireUser(req);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const rows = await rawSql(
      `SELECT UnitID, UnitName, Abbreviation, System
       FROM UnitsOfMeasurement WHERE UnitID = @param0`,
      [parseInt(id, 10)],
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}
