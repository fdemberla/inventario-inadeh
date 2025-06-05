import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const queryStr = searchParams.get("q");

  if (!queryStr || queryStr.trim().length < 2) {
    return NextResponse.json(
      { message: "La búsqueda debe tener al menos 2 caracteres." },
      { status: 400 },
    );
  }

  try {
    const searchQuery = `%${queryStr}%`;

    const query = `
      SELECT
        codigo,
        nombre,
        descripcion
      FROM dbo.ProductsIstmo
      WHERE nombre LIKE @param0 OR descripcion LIKE @param1
      ORDER BY nombre
    `;

    const results = await rawSql(query, [searchQuery, searchQuery]);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error during product search:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
