// app/api/inventory/scanner/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rawSql } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  // Validate user from session
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "No autorizado" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const warehouseId = searchParams.get("warehouseId");

  if (!warehouseId) {
    return NextResponse.json(
      { success: false, message: "warehouseId es requerido" },
      { status: 400 },
    );
  }

  try {
    // Get warehouse info
    const warehouseResult = await rawSql(
      `SELECT WarehouseID, WarehouseName, WarehouseCode, Location 
       FROM Warehouses WHERE WarehouseID = @param0`,
      [warehouseId],
    );

    if (warehouseResult.length === 0) {
      return NextResponse.json(
        { success: false, message: "Almacén no encontrado" },
        { status: 404 },
      );
    }

    const warehouse = warehouseResult[0];

    // Get all products with their inventory in this warehouse
    const productsResult = await rawSql(
      `SELECT 
         p.ProductID as productId,
         p.Barcode as barcode,
         p.ProductName as productName,
         c.CategoryName as categoryName,
         u.UnitName as unitName,
         ISNULL(i.QuantityOnHand, 0) as currentQuantity
       FROM Products p
       LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
       LEFT JOIN UnitsOfMeasurement u ON p.UnitID = u.UnitID
       LEFT JOIN Inventory i ON p.ProductID = i.ProductID AND i.WarehouseID = @param0
       WHERE p.Barcode IS NOT NULL AND p.Barcode != ''
       ORDER BY p.ProductName`,
      [warehouseId],
    );

    return NextResponse.json({
      success: true,
      warehouse: {
        warehouseId: warehouse.WarehouseID,
        warehouseName: warehouse.WarehouseName,
        warehouseCode: warehouse.WarehouseCode,
        location: warehouse.Location,
      },
      products: productsResult,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching products for cache:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
