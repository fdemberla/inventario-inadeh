import { NextRequest, NextResponse } from "next/server";
import { rawSql } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";

// Only custom units can be edited: renaming a standard unit (e.g. "Kilogramo")
// would silently change the meaning of every product that uses it.
const EDITABLE_SYSTEM = "Personalizado";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const { id: idParam } = await context.params;
  if (!/^\d+$/.test(idParam)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const id = parseInt(idParam, 10);

  try {
    const { UnitName, Abbreviation } = await req.json();

    if (!UnitName || typeof UnitName !== "string" || !UnitName.trim()) {
      return NextResponse.json(
        { error: "El nombre de la unidad es obligatorio." },
        { status: 400 },
      );
    }
    if (UnitName.length > 100 || (Abbreviation && String(Abbreviation).length > 20)) {
      return NextResponse.json({ error: "Valores demasiado largos." }, { status: 400 });
    }

    const existing = await rawSql(
      `SELECT System FROM UnitsOfMeasurement WHERE UnitID = @param0`,
      [id],
    );
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
    }
    if (existing[0].System !== EDITABLE_SYSTEM) {
      return NextResponse.json(
        { error: "Solo se pueden editar las unidades personalizadas." },
        { status: 409 },
      );
    }

    await rawSql(
      `UPDATE UnitsOfMeasurement
       SET UnitName = @param0, Abbreviation = @param1
       WHERE UnitID = @param2`,
      [UnitName.trim(), Abbreviation ? String(Abbreviation).trim() : null, id],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar unidad:", error);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}
