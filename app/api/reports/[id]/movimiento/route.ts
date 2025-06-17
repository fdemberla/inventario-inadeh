import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);
    const category = req.nextUrl.searchParams.get("category");

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid Warehouse ID" },
        { status: 400 },
      );
    }

    const categoryId = parseInt(category || ""); // safely handle null
    const isValidCategory = !isNaN(categoryId);

    let whereClause = `inv.WarehouseID = @param0`;
    const sqlParams: (string | number)[] = [id];

    if (isValidCategory) {
      whereClause += ` AND pro.CategoryID = @param1`;
      sqlParams.push(categoryId);
    }

    const query = `
      SELECT 
        FORMAT(CAST(inv_tr.[CreatedDate] AS DATE), 'dd/MM') as date,
        ISNULL(SUM(CASE WHEN inv_tr.[QuantityChange] > 0 THEN inv_tr.[QuantityChange] ELSE 0 END), 0) as inbound,
        ISNULL(SUM(CASE WHEN inv_tr.[QuantityChange] < 0 THEN ABS(inv_tr.[QuantityChange]) ELSE 0 END), 0) as outbound,
        ISNULL(SUM(inv_tr.[QuantityChange]), 0) as net
      FROM [dbo].[InventoryTransactions] inv_tr
      JOIN dbo.Inventory inv ON inv_tr.InventoryID = inv.InventoryID
      JOIN dbo.Products pro ON inv.ProductID = pro.ProductID
      WHERE ${whereClause}
      GROUP BY CAST(inv_tr.[CreatedDate] AS DATE)
      ORDER BY CAST(inv_tr.[CreatedDate] AS DATE) ASC;
    `;

    const result = await rawSql(query, sqlParams);

    if (result.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching transaction data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
