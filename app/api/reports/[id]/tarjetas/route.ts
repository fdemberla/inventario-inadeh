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

    const sqlParamsStock = [id];
    const sqlParamsValor = [id];
    const sqlParamsProductos = [id];

    let stockCategoryFilter = "";
    let valorCategoryJoin = "";
    let valorCategoryFilter = "";
    let productosCategoryFilter = "";

    if (isValidCategory) {
      stockCategoryFilter = `
        AND inv.ProductID IN (
          SELECT ProductID FROM dbo.Products WHERE CategoryID = @param1
        )`;
      valorCategoryJoin = `JOIN dbo.Products pro ON inv.ProductID = pro.ProductID`;
      valorCategoryFilter = ` AND pro.CategoryID = @param1`;
      productosCategoryFilter = `
        AND ProductID IN (
          SELECT ProductID FROM dbo.Products WHERE CategoryID = @param1
        )`;

      // Add categoryId to all param arrays
      sqlParamsStock.push(categoryId);
      sqlParamsValor.push(categoryId);
      sqlParamsProductos.push(categoryId);
    } else {
      valorCategoryJoin = `JOIN dbo.Products pro ON inv.ProductID = pro.ProductID`;
    }

    const queryStockBajo = `
      SELECT inv.InventoryID
      FROM [dbo].[Inventory] inv
      WHERE inv.WarehouseID = @param0
      ${stockCategoryFilter}
      AND inv.QuantityOnHand <= inv.ReorderLevel
    `;

    const queryValorTotal = `
      SELECT 
        ROUND(SUM([QuantityOnHand] * pro.Cost), 2) AS value
      FROM [dbo].[Inventory] inv
      ${valorCategoryJoin}
      WHERE inv.WarehouseID = @param0
      ${valorCategoryFilter}
    `;

    const queryProductosEnInventario = `
      SELECT ProductID 
      FROM dbo.Inventory
      WHERE WarehouseID = @param0
      ${productosCategoryFilter}
      AND QuantityOnHand > 0
      GROUP BY ProductID
    `;

    const [stockBajoResult, valorTotalResult, productosEnInventarioResult] =
      await Promise.all([
        rawSql(queryStockBajo, sqlParamsStock),
        rawSql(queryValorTotal, sqlParamsValor),
        rawSql(queryProductosEnInventario, sqlParamsProductos),
      ]);

    const response = {
      stockBajo: {
        name: "stockBajo",
        data: stockBajoResult,
        count: stockBajoResult.length,
      },
      valorTotal: {
        name: "valorTotal",
        data: valorTotalResult,
        value: valorTotalResult.length > 0 ? valorTotalResult[0].value : 0,
      },
      productosEnInventario: {
        name: "productosEnInventario",
        data: productosEnInventarioResult,
        count: productosEnInventarioResult.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching warehouse data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
