import { NextResponse, NextRequest } from "next/server";
import { rawSql } from "@/lib/db";
import { getApiAuth, isAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getApiAuth(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Acceso denegado. Se requieren permisos de administrador." }, { status: 403 });
    }
    const body = await req.json();
    const { UnitName, Abbreviation } = body;

    if (!UnitName || typeof UnitName !== "string") {
      return NextResponse.json(
        { error: "El nombre de la unidad es obligatorio." },
        { status: 400 },
      );
    }

    // Define the query with parameter placeholders
    const query = `
        INSERT INTO UnitsOfMeasurement (UnitName, Abbreviation, System)
        VALUES (@param0, @param1, 'Personalizado')
      `;

    const params = [UnitName, Abbreviation || null];

    // const params = [
    //   { name: "UnitName", value: UnitName },
    //   { name: "Abbreviation", value: Abbreviation || null },
    // ];

    // Call the `sql` helper with parameterized values
    await rawSql(query, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al crear unidad personalizada:", error);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}
