import { NextResponse, NextRequest } from "next/server";
import { rawSql } from "@/lib/db";

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

    const categoryId = parseInt(category || "");
    const isValidCategory = !isNaN(categoryId);

    let whereClause = `inv.WarehouseID = @param0`;
    const sqlParams: (number | string)[] = [id];

    if (isValidCategory) {
      whereClause += ` AND prod.CategoryID = @param1`;
      sqlParams.push(categoryId);
    }

    // Determine the SELECT and GROUP BY clauses based on whether we have a valid category
    const selectClause = isValidCategory
      ? `prod.ProductName AS name, SUM([QuantityOnHand]) AS nivel`
      : `cat.CategoryName AS name, SUM([QuantityOnHand]) AS nivel`;

    const groupByClause = isValidCategory
      ? `prod.ProductName`
      : `cat.CategoryName`;

    const query = `
      SELECT 
        ${selectClause}
      FROM [dbo].[Inventory] inv
      LEFT JOIN dbo.Products prod ON inv.ProductID = prod.ProductID
      LEFT JOIN dbo.Categories cat ON cat.CategoryID = prod.CategoryID
      WHERE ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY nivel DESC;
    `;

    const result = await rawSql(query, sqlParams);

    if (result.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
