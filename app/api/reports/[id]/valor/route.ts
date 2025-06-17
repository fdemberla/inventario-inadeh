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
    const sqlParams: (string | number)[] = [id];

    if (isValidCategory) {
      whereClause += ` AND pro.CategoryID = @param1`;
      sqlParams.push(categoryId);
    }

    const query = `
      SELECT 
        cat.CategoryName AS name,
        ROUND(SUM([QuantityOnHand] * pro.Cost), 2) AS value,
        CASE 
            WHEN ROUND((SUM([QuantityOnHand] * pro.Cost) * 100.0) / SUM(SUM([QuantityOnHand] * pro.Cost)) OVER(), 2) < 1 
                 AND SUM([QuantityOnHand] * pro.Cost) > 0
            THEN ROUND((SUM([QuantityOnHand] * pro.Cost) * 100.0) / SUM(SUM([QuantityOnHand] * pro.Cost)) OVER(), 2)
            ELSE ROUND((SUM([QuantityOnHand] * pro.Cost) * 100.0) / SUM(SUM([QuantityOnHand] * pro.Cost)) OVER(), 2)
        END AS percentage
      FROM [dbo].[Inventory] inv
      JOIN dbo.Products pro ON inv.ProductID = pro.ProductID
      JOIN dbo.Categories cat ON pro.CategoryID = cat.CategoryID
      WHERE ${whereClause}
      GROUP BY cat.CategoryName
      ORDER BY value DESC;
    `;

    const result = await rawSql(query, sqlParams);

    if (result.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Warehouse:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
