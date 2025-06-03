import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/suppliers/:id/edit - update supplier
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const data = await req.json();

    const result = await sql(
      `
      UPDATE Suppliers
      SET SupplierName = @param0,
          ContactPerson = @param1,
          Phone = @param2,
          Email = @param3,
          Address = @param4,
          ModifiedDate = SYSUTCDATETIME()
      WHERE SupplierID = @param5
    `,
      [
        data.supplierName,
        data.contactPerson,
        data.phone,
        data.email,
        data.address,
        params.id,
      ],
    );

    return NextResponse.json({
      message: "Proveedor actualizado correctamente.",
      result: result,
    });
  } catch (error) {
    console.error("PUT supplier error:", error);
    return NextResponse.json(
      { error: "Error al actualizar proveedor." },
      { status: 500 },
    );
  }
}
