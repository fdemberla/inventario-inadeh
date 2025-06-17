// import { NextResponse } from "next/server";
// import { rawSql } from "@/lib/db";

// export async function GET(
//   req: Request,
//   { params }: { params: { id: string; category: string } },
// ) {
//   try {
//     const id = parseInt(params.id);
//     if (isNaN(id)) {
//       return NextResponse.json(
//         { message: "Invalid Warehouse ID" },
//         { status: 400 },
//       );
//     }

//     const query = `SELECT
//     pro.ProductName,
//     inv.QuantityOnHand,
//     ISNULL(inv.ReorderLevel, 0) AS ReorderLevel,
//     CASE
//         WHEN inv.QuantityOnHand <= (ISNULL(inv.ReorderLevel, 0) * 0.6) THEN 'critical'
//         WHEN inv.QuantityOnHand <= ISNULL(inv.ReorderLevel, 0) THEN 'warning'
//         ELSE 'normal'
//     END AS Status
// FROM [dbo].[Inventory] inv
// JOIN dbo.Products pro ON inv.ProductID = pro.ProductID
// WHERE inv.WarehouseID = @param0 AND inv.QuantityOnHand <= inv.ReorderLevel
// ORDER BY
//     CASE
//         WHEN inv.QuantityOnHand <= (ISNULL(inv.ReorderLevel, 0) * 0.6) THEN 1
//         WHEN inv.QuantityOnHand <= ISNULL(inv.ReorderLevel, 0) THEN 2
//         ELSE 3
//     END,
//     inv.QuantityOnHand ASC;

// `;
//     const result = await rawSql(query, [id]);

//     if (result.length === 0) {
//       return NextResponse.json([]);
//     }

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error("Error fetching warehouse inventory data:", error);
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

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

    const categoryId = parseInt(category);
    const isValidCategory = !isNaN(categoryId);

    // Construct WHERE clause dynamically
    let whereClause = `
      inv.WarehouseID = @param0 
      AND inv.QuantityOnHand <= inv.ReorderLevel
    `;

    const sqlParams: (string | number)[] = [id];

    if (isValidCategory) {
      whereClause += ` AND pro.CategoryID = @param1`;
      sqlParams.push(categoryId);
    }

    const query = `
      SELECT
        pro.ProductName,
        inv.QuantityOnHand,
        ISNULL(inv.ReorderLevel, 0) AS ReorderLevel,
        CASE 
          WHEN inv.QuantityOnHand <= (ISNULL(inv.ReorderLevel, 0) * 0.6) THEN 'critical'
          WHEN inv.QuantityOnHand <= ISNULL(inv.ReorderLevel, 0) THEN 'warning'
          ELSE 'normal'
        END AS Status
      FROM [dbo].[Inventory] inv
      JOIN dbo.Products pro ON inv.ProductID = pro.ProductID
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN inv.QuantityOnHand <= (ISNULL(inv.ReorderLevel, 0) * 0.6) THEN 1
          WHEN inv.QuantityOnHand <= ISNULL(inv.ReorderLevel, 0) THEN 2
          ELSE 3
        END,
        inv.QuantityOnHand ASC;
    `;

    const result = await rawSql(query, sqlParams);

    if (result.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching warehouse inventory data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
