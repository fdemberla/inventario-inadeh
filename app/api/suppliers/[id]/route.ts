import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";

// GET /api/suppliers/:id/edit - fetch single supplier
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await getApiAuth(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // Await params if required by Next.js 15, or leave as is if Next.js 14
    const supplierId = params.id;
    const result = await sql(
      `SELECT SupplierID, SupplierName, ContactPerson, Phone, Email, Address, IsActive, CreatedDate, ModifiedDate
       FROM dbo.Suppliers WHERE SupplierID = @param0`,
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
