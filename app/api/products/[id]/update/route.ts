// --- BACKEND: /api/products/[id]/update.ts ---

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(req: Request, context: { params: { id: string } }) {
  try {
    const productId = parseInt(context.params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 },
      );
    }

    const {
      productName,
      sku,
      description,
      barcode,
      categoryID,
      imageURL,
      cost,
      unitID,
      suppliers,
    } = await req.json();

    if (!productName || !sku || !unitID) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const updateProductQuery = `
      UPDATE Products
      SET ProductName = @param0,
          InternalSKU = @param1,
          Description = @param2,
          Barcode = @param3,
          CategoryID = @param4,
          ImageURL = @param5,
          Cost = @param6,
          UnitID = @param7,
          ModifiedDate = SYSUTCDATETIME()
      WHERE ProductID = @param8
    `;

    const productParams = [
      productName,
      sku,
      description ?? null,
      barcode ?? null,
      categoryID ?? null,
      imageURL ?? null,
      cost ?? 0,
      unitID,
      productId,
    ];

    await sql(updateProductQuery, productParams);

    // Eliminar proveedores existentes y volver a insertarlos
    await sql(`DELETE FROM ProductSuppliers WHERE ProductID = @param0`, [
      productId,
    ]);

    for (const supplier of suppliers) {
      await sql(
        `INSERT INTO ProductSuppliers
         (ProductID, SupplierID, SupplierSKU, LeadTimeDays, Cost, IsPrimarySupplier)
         VALUES (@param0, @param1, @param2, @param3, @param4, @param5)`,
        [
          productId,
          supplier.supplierID,
          supplier.supplierSKU ?? null,
          supplier.leadTimeDays ?? null,
          supplier.cost ?? 0,
          supplier.isPrimarySupplier ? 1 : 0,
        ],
      );
    }

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
