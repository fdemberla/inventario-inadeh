import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();

  try {
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
