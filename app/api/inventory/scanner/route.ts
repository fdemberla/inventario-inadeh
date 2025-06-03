// api/inventory/scanner/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rawSql } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({
      success: false,
      message: "Método no permitido",
    });
  }

  const body = await req.json();
  const { barcode, warehouseId, operation } = body;

  if (!barcode || !warehouseId || !operation) {
    return NextResponse.json({
      success: false,
      message: "Faltan datos requeridos",
    });
  }

  let createdBy: string | number = "scanner";
  try {
    const token = req.cookies.get("token")?.value;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown;
      createdBy = decoded?.username || decoded?.id || createdBy;
    }
  } catch (err: unknown) {
    console.warn(
      "No se pudo decodificar el token, usando 'scanner' como usuario",
      err,
    );
  }

  try {
    const productResult = await rawSql(
      `SELECT ProductID, ProductName FROM Products WHERE Barcode = @param0`,
      [barcode],
    );

    if (productResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "El producto no existe.",
          internalErrorCode: 404,
          invalidBarcode: barcode,
          barcode: barcode,
        },
        { status: 404 },
      );
    }

    const product = productResult[0];

    const inventoryResult = await rawSql(
      `SELECT InventoryID, QuantityOnHand FROM Inventory WHERE ProductID = @param0 AND WarehouseID = @param1`,
      [product.ProductID, warehouseId],
    );

    const inventoryExists = inventoryResult.length > 0;
    let newQuantity = 0;

    if (operation === "entrada") {
      if (inventoryExists) {
        const currentQty = inventoryResult[0].QuantityOnHand;
        newQuantity = currentQty + 1;

        await rawSql(
          `UPDATE Inventory SET QuantityOnHand = @param0, ModifiedDate = SYSDATETIME() WHERE InventoryID = @param1`,
          [newQuantity, inventoryResult[0].InventoryID],
        );

        await rawSql(
          `INSERT INTO inventario.dbo.InventoryTransactions 
            (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy) 
            VALUES (@param0, 'RECEIPT', @param1, NULL, @param2, @param3)`,
          [
            inventoryResult[0].InventoryID,
            1,
            "Registro realizado con escáner",
            createdBy,
          ],
        );
      } else {
        newQuantity = 1;

        await rawSql(
          `INSERT INTO Inventory (ProductID, WarehouseID, QuantityOnHand, CreatedDate) VALUES (@param0, @param1, @param2, SYSDATETIME())`,
          [product.ProductID, warehouseId, newQuantity],
        );

        const insertedInventory = await rawSql(
          `SELECT TOP 1 InventoryID FROM Inventory WHERE ProductID = @param0 AND WarehouseID = @param1 ORDER BY CreatedDate DESC`,
          [product.ProductID, warehouseId],
        );

        await rawSql(
          `INSERT INTO inventario.dbo.InventoryTransactions 
            (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy) 
            VALUES (@param0, 'RECEIPT', @param1, NULL, @param2, @param3)`,
          [
            insertedInventory[0].InventoryID,
            1,
            "Registro realizado con escáner",
            createdBy,
          ],
        );
      }
    } else if (operation === "salida") {
      if (!inventoryExists) {
        return NextResponse.json(
          {
            success: false,
            message:
              "El producto no está registrado en el inventario de este deposito.",
            product: {
              id: product.ProductID,
              name: product.ProductName,
              barcode: barcode,
            },
            internalErrorCode: 409,
          },
          { status: 409 },
        );
      }

      const currentQty = inventoryResult[0].QuantityOnHand;
      if (currentQty <= 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "No se puede registrar la salida. La cantidad actual en inventario es 0.",
            product: {
              id: product.ProductID,
              name: product.ProductName,
              barcode: barcode,
            },
            internalErrorCode: 400,
            barcode: barcode,
          },
          { status: 400 },
        );
      }

      newQuantity = currentQty - 1;

      await rawSql(
        `UPDATE Inventory SET QuantityOnHand = @param0, ModifiedDate = SYSDATETIME() WHERE InventoryID = @param1`,
        [newQuantity, inventoryResult[0].InventoryID],
      );

      await rawSql(
        `INSERT INTO inventario.dbo.InventoryTransactions 
          (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy) 
          VALUES (@param0, 'SHIPMENT', @param1, NULL, @param2, @param3)`,
        [
          inventoryResult[0].InventoryID,
          -1,
          "Registro realizado con escáner",
          createdBy,
        ],
      );
    }

    return NextResponse.json({
      success: true,
      message: `Inventario actualizado correctamente (${operation}) (${product.ProductName}) Cantidad Actual: ${newQuantity}`,
      product: {
        id: product.ProductID,
        name: product.ProductName,
        barcode: barcode,
      },
      quantity: newQuantity,
      operation,
      createdBy,
    });
  } catch (error) {
    console.error("Error en /api/inventory/scanner:", error);
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
    });
  }
}
