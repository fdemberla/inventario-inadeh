// /app/api/products/route.ts
import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db";

export async function GET() {
  try {
    const products = await rawSql(
      `
      SELECT p.ProductID, p.ProductName, p.InternalSKU, p.Barcode, c.CategoryName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
    `,
      [],
    );

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Error fetching products" },
      { status: 500 },
    );
  }
}
