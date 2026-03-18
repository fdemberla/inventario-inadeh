// // /app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { rawSql, sql } from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await context.params;
    const id = parseInt(idParam);
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

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await context.params;
    const productId = parseInt(idParam);

    if (isNaN(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 },
      );
    }

    // Block deletion if product has active stock in any warehouse
    const stockResult = await rawSql(
      `SELECT COALESCE(SUM(QuantityOnHand), 0) AS TotalStock
       FROM Inventory
       WHERE ProductID = @param0`,
      [productId],
    );

    const totalStock = Number(stockResult[0]?.TotalStock ?? 0);
    if (totalStock > 0) {
      return NextResponse.json(
        {
          message:
            "No se puede eliminar: el producto tiene inventario activo en uno o más almacenes",
        },
        { status: 409 },
      );
    }

    await sql(
      `UPDATE Products SET IsActive = 0, ModifiedDate = SYSUTCDATETIME() WHERE ProductID = @param0`,
      [productId],
    );

    return NextResponse.json({ message: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
