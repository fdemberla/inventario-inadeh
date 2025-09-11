// app/api/warehouses/[id]/stats/route.ts
import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db";

interface WarehouseStats {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const warehouseId = id;

    // Validate the warehouse ID
    if (!warehouseId || !/^\d+$/.test(warehouseId)) {
      return NextResponse.json(
        { error: "Valid numeric warehouse ID is required" },
        { status: 400 },
      );
    }

    // Get warehouse statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as totalProducts,
        SUM(CASE 
          WHEN i.QuantityOnHand > ISNULL(i.ReorderLevel, 0) 
          THEN 1 
          ELSE 0 
        END) as inStockProducts,
        SUM(CASE 
          WHEN i.QuantityOnHand <= ISNULL(i.ReorderLevel, 0) AND i.QuantityOnHand > 0 
          THEN 1 
          ELSE 0 
        END) as lowStockProducts,
        SUM(CASE 
          WHEN i.QuantityOnHand = 0 
          THEN 1 
          ELSE 0 
        END) as outOfStockProducts,
        COUNT(DISTINCT p.CategoryID) as totalCategories
      FROM dbo.Inventory i
      JOIN dbo.Products p ON i.ProductID = p.ProductID
      WHERE i.WarehouseID = @param0
    `;

    const result = (await rawSql(statsQuery, [
      Number(warehouseId),
    ])) as WarehouseStats[];

    if (!result || result.length === 0) {
      return NextResponse.json(
        {
          totalProducts: 0,
          inStockProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          totalCategories: 0,
        },
        { status: 200 },
      );
    }

    const stats = result[0];

    return NextResponse.json(
      {
        totalProducts: stats.totalProducts || 0,
        inStockProducts: stats.inStockProducts || 0,
        lowStockProducts: stats.lowStockProducts || 0,
        outOfStockProducts: stats.outOfStockProducts || 0,
        totalCategories: stats.totalCategories || 0,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching warehouse stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch warehouse statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
