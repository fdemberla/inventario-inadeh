// // /app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 },
      );
    }

    // Query to get product, supplier details, and unit of measurement
    const query = `
      SELECT p.ProductID, p.ProductName, p.InternalSKU, p.Description, p.Barcode, 
             p.CategoryID, p.ImageURL, p.Cost, p.UnitID, p.CreatedDate, p.ModifiedDate,
             u.UnitName, u.System AS UnitSystem, 
             ps.SupplierID, ps.SupplierSKU, ps.LeadTimeDays, ps.Cost AS SupplierCost, ps.IsPrimarySupplier
      FROM Products p
      LEFT JOIN ProductSuppliers ps ON p.ProductID = ps.ProductID
      LEFT JOIN UnitsOfMeasurement u ON p.UnitID = u.UnitID
      WHERE p.ProductID = @param0
    `;

    const result = await rawSql(query, [id]);

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    // Structure the result to return product along with its suppliers and unit of measurement
    const product = result[0];
    const suppliers = result
      .map((row) => ({
        supplierID: row.SupplierID,
        supplierSKU: row.SupplierSKU,
        leadTimeDays: row.LeadTimeDays,
        cost: row.SupplierCost,
        isPrimarySupplier: row.IsPrimarySupplier,
      }))
      .filter((supplier) => supplier.supplierID); // Filter out rows without supplier data

    const unitOfMeasurement = {
      unitName: product.UnitName,
      system: product.UnitSystem,
    };

    return NextResponse.json({
      product: {
        ...product,
        suppliers,
        unitOfMeasurement,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
