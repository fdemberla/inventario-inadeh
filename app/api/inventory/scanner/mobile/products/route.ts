// app/api/inventory/scanner/mobile/products/route.ts
// Get products for caching on mobile device
import { NextRequest, NextResponse } from "next/server";
import { rawSql } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  try {
    // Get user from Bearer token
    const session = await getMobileSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");

    if (!warehouseId) {
      return NextResponse.json(
        { success: false, message: "warehouseId es requerido" },
        { status: 400 }
      );
    }

    // Validate warehouseId is numeric
    if (!/^\d+$/.test(warehouseId)) {
      return NextResponse.json(
        { success: false, message: "warehouseId debe ser numérico" },
        { status: 400 }
      );
    }

    // Get warehouse info
    const warehouseResult = await rawSql(
      `SELECT WarehouseID, WarehouseName, WarehouseCode, Location 
       FROM Warehouses WHERE WarehouseID = @param0`,
      [parseInt(warehouseId, 10)]
    );

    if (warehouseResult.length === 0) {
      return NextResponse.json(
        { success: false, message: "Almacén no encontrado" },
        { status: 404 }
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
         ISNULL(i.QuantityOnHand, 0) as currentQuantity,
         p.InternalSKU as sku
       FROM Products p
       LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
       LEFT JOIN UnitsOfMeasurement u ON p.UnitID = u.UnitID
       LEFT JOIN Inventory i ON p.ProductID = i.ProductID AND i.WarehouseID = @param0
       WHERE p.Barcode IS NOT NULL AND p.Barcode != ''
       ORDER BY p.ProductName`,
      [parseInt(warehouseId, 10)]
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
      productCount: productsResult.length,
      userId: session.id,
      username: session.username,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching products for mobile cache:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// Reject other methods
export async function POST() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}
