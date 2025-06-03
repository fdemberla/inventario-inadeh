import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db"; // Ensure this is correctly pointing to your SQL helper

export async function POST(req: Request) {
  try {
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
