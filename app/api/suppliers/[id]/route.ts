import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/suppliers/:id/edit - fetch single supplier
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supplierId = params.id;

  try {
    const result = await sql(
      `SELECT SupplierID, SupplierName, ContactPerson, Phone, Email, Address, IsActive, CreatedDate, ModifiedDate
       FROM inventario.dbo.Suppliers WHERE SupplierID = @param0`,
      [supplierId],
    );

    const supplier = result.recordset?.[0]; // Access the first row directly

    if (!supplier) {
      return NextResponse.json(
        {
          error: `Proveedor no encontrado. ID buscado: ${supplierId}`,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error("GET supplier error:", error);
    return NextResponse.json(
      {
        error: "Error al obtener proveedor.",
        debug: { error: String(error), params },
      },
      { status: 500 },
    );
  }
}
