// app/api/inventory/[id]/route.ts
import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db";

// Define the expected response type
interface InventoryItem {
  InventoryID: number;
  ProductID: number;
  WarehouseID: number;
  QuantityOnHand: number;
  QuantityReserved: number;
  ReorderLevel: number | null;
  LastStockedDate: string | null;
  CreatedDate: string;
  ModifiedDate: string | null;
  ProductName: string;
  // Removed ProductCode since it doesn't exist in your database
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Fix for Next.js dynamic route params warning
    const { id } = await context.params; // Await here
    const warehouseId = id;

    // Validate the warehouse ID
    if (!warehouseId || !/^\d+$/.test(warehouseId)) {
      return NextResponse.json(
        { error: "Valid numeric warehouse ID is required" },
        { status: 400 },
      );
    }

    // Execute the query with parameterized input
    // Removed p.ProductCode from the query since it doesn't exist
    const result = await rawSql<InventoryItem[]>(
      `
        SELECT 
        i.InventoryID,
        i.ProductID,
        i.WarehouseID,
        i.QuantityOnHand,
        i.QuantityReserved,
        i.ReorderLevel,
        i.LastStockedDate,
        i.CreatedDate,
        i.ModifiedDate,
        p.ProductName,
        p.Barcode,
        uom.UnitName
      FROM dbo.Inventory i
      JOIN dbo.Products p ON i.ProductID = p.ProductID
      JOIN dbo.UnitsOfMeasurement uom  ON p.UnitID = uom.UnitID
      WHERE i.WarehouseID = @param0
      ORDER BY p.ProductName ASC
      `,
      [Number(warehouseId)],
    );

    // Check if any results were returned
    if (!result || result.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch inventory",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
