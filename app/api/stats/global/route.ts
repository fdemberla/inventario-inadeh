// app/api/stats/global/route.ts
import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db";

interface GlobalStats {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  totalCategories: number;
}

export async function GET() {
  try {
    // Get global statistics across all warehouses
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT p.ProductID) as totalProducts,
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
        COUNT(DISTINCT p.CategoryID) as totalCategories
      FROM dbo.Products p
      LEFT JOIN dbo.Inventory i ON p.ProductID = i.ProductID
    `;

    const result = (await rawSql(statsQuery, [])) as GlobalStats[];

    if (!result || result.length === 0) {
      return NextResponse.json(
        {
          totalProducts: 0,
          inStockProducts: 0,
          lowStockProducts: 0,
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
        totalCategories: stats.totalCategories || 0,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch global statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
