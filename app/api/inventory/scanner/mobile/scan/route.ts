// app/api/inventory/scanner/mobile/scan/route.ts
// Mobile single barcode scan endpoint
import { NextRequest, NextResponse } from "next/server";
import { rawSql } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";

interface ScanRequest {
  barcode: string;
  warehouseId: number;
  operation: "entrada" | "salida";
  quantity?: number;
}

export async function POST(req: NextRequest) {
  try {
    // Get user from Bearer token
    const session = await getMobileSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();

    // Validate request body
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { barcode, warehouseId, operation, quantity } = body as Partial<
      ScanRequest
    >;

    // Validate required fields
    if (!barcode || !warehouseId || !operation) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan datos requeridos: barcode, warehouseId, operation",
        },
        { status: 400 }
      );
    }

    // Validate operation
    if (!["entrada", "salida"].includes(operation)) {
      return NextResponse.json(
        { success: false, message: "Operation debe ser 'entrada' o 'salida'" },
        { status: 400 }
      );
    }

    const scanQuantity = quantity && quantity > 0 ? quantity : 1;
    const createdBy = session.username || `user_${session.id}`;

    // Find product by barcode
    const productResult = await rawSql(
      `SELECT ProductID, ProductName FROM Products WHERE Barcode = @param0`,
      [barcode]
    );

    if (productResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "El producto no existe",
          internalErrorCode: 404,
          barcode,
        },
        { status: 404 }
      );
    }

    const product = productResult[0];

    // Get current inventory
    const inventoryResult = await rawSql(
      `SELECT InventoryID, QuantityOnHand FROM Inventory WHERE ProductID = @param0 AND WarehouseID = @param1`,
      [product.ProductID, warehouseId]
    );

    const inventoryExists = inventoryResult.length > 0;
    let newQuantity = 0;

    if (operation === "entrada") {
      if (inventoryExists) {
        const currentQty = inventoryResult[0].QuantityOnHand;
        newQuantity = currentQty + scanQuantity;

        await rawSql(
          `UPDATE Inventory SET QuantityOnHand = @param0, ModifiedDate = SYSDATETIME() WHERE InventoryID = @param1`,
          [newQuantity, inventoryResult[0].InventoryID]
        );

        await rawSql(
          `INSERT INTO dbo.InventoryTransactions 
            (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy, ProductID) 
            VALUES (@param0, 'RECEIPT', @param1, NULL, @param2, @param3, @param4)`,
          [
            inventoryResult[0].InventoryID,
            scanQuantity,
            "Escaneo móvil - entrada",
            createdBy,
            product.ProductID,
          ]
        );
      } else {
        newQuantity = scanQuantity;

        await rawSql(
          `INSERT INTO Inventory (ProductID, WarehouseID, QuantityOnHand, CreatedDate) VALUES (@param0, @param1, @param2, SYSDATETIME())`,
          [product.ProductID, warehouseId, newQuantity]
        );

        const insertedInventory = await rawSql(
          `SELECT TOP 1 InventoryID FROM Inventory WHERE ProductID = @param0 AND WarehouseID = @param1 ORDER BY CreatedDate DESC`,
          [product.ProductID, warehouseId]
        );

        await rawSql(
          `INSERT INTO dbo.InventoryTransactions 
            (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy, ProductID) 
            VALUES (@param0, 'RECEIPT', @param1, NULL, @param2, @param3, @param4)`,
          [
            insertedInventory[0].InventoryID,
            scanQuantity,
            "Escaneo móvil - entrada",
            createdBy,
            product.ProductID,
          ]
        );
      }
    } else if (operation === "salida") {
      if (!inventoryExists) {
        return NextResponse.json(
          {
            success: false,
            message:
              "El producto no está registrado en el inventario de este almacén",
            product: {
              id: product.ProductID,
              name: product.ProductName,
              barcode,
            },
            internalErrorCode: 409,
          },
          { status: 409 }
        );
      }

      const currentQty = inventoryResult[0].QuantityOnHand;
      if (currentQty < scanQuantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Cantidad insuficiente. Disponible: ${currentQty}, Solicitado: ${scanQuantity}`,
            product: {
              id: product.ProductID,
              name: product.ProductName,
              barcode,
            },
            currentQuantity: currentQty,
            internalErrorCode: 400,
          },
          { status: 400 }
        );
      }

      newQuantity = currentQty - scanQuantity;

      await rawSql(
        `UPDATE Inventory SET QuantityOnHand = @param0, ModifiedDate = SYSDATETIME() WHERE InventoryID = @param1`,
        [newQuantity, inventoryResult[0].InventoryID]
      );

      await rawSql(
        `INSERT INTO dbo.InventoryTransactions 
          (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy, ProductID) 
          VALUES (@param0, 'SHIPMENT', @param1, NULL, @param2, @param3, @param4)`,
        [
          inventoryResult[0].InventoryID,
          -scanQuantity,
          "Escaneo móvil - salida",
          createdBy,
          product.ProductID,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Inventario actualizado correctamente (${operation})`,
      product: {
        id: product.ProductID,
        name: product.ProductName,
        barcode,
      },
      quantity: newQuantity,
      operation,
      userId: session.id,
      username: session.username,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in mobile scan endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// Reject other methods
export async function GET() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}
