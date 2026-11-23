import { sql } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
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
    const data = await req.json();
    const params = [
      data.supplierName,
      data.contactPerson,
      data.phone,
      data.email,
      data.address,
    ];

    await sql(
      `
      INSERT INTO Suppliers (SupplierName, ContactPerson, Phone, Email, Address)
      VALUES (@param0, @param1, @param2, @param3, @param4)
    `,
      params,
    );

    return NextResponse.json({ message: "Supplier created." });
  } catch (error) {
    console.error("Error inserting supplier:", error);
    return NextResponse.json(
      { error: "Error creating supplier." },
      { status: 500 },
    );
  }
}
