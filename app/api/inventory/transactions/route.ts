import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const order =
      searchParams.get("order")?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const inventoryId = searchParams.get("inventoryId");

    let query = `
      SELECT
        it.TransactionID,
        it.InventoryID,
        TransactionType,
        QuantityChange,
        ReferenceNumber,
        Notes,
        CreatedBy,
        FORMAT(it.CreatedDate, 'dddd d hh:mm tt MMMM yyyy') AS FormattedDate,
        w.WarehouseName,
        p.ProductName
      FROM dbo.InventoryTransactions it
      LEFT JOIN dbo.Inventory i on it.InventoryID = i.InventoryID 
      LEFT JOIN dbo.Warehouses w ON i.WarehouseID = w.WarehouseID
      LEFT JOIN dbo.Products p on i.ProductID = p.ProductID
    `;

    const params = [limit];

    if (inventoryId) {
      query += "WHERE it.InventoryID = @param1\n";
      params.push(parseInt(inventoryId, 10));
    }

    query += `ORDER BY it.CreatedDate ${order};`;

    const result = await sql(query, params);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching inventory transactions:", error);
    return NextResponse.json(
      { message: "Error al obtener las transacciones de " },
      { status: 500 },
    );
  }
}
