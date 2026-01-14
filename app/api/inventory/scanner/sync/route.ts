// app/api/inventory/scanner/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rawSql, withTransaction } from "@/lib/db";
import { auth } from "@/auth";

interface ScanItem {
  id: number;
  barcode: string;
  warehouseId: number;
  operation: "entrada" | "salida";
  quantity: number;
  timestamp: string;
  deviceId: string;
  userId: string;
  productId?: number;
  verified: boolean;
}

interface BulkSyncPayload {
  scans: ScanItem[];
  deviceId: string;
}

interface SyncResultItem {
  id: number;
  success: boolean;
  error?: string;
  conflictType?: string;
  serverQuantity?: number;
}

export async function POST(req: NextRequest) {
  // Authentication check - require valid session
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "No autorizado" },
      { status: 401 }
    );
  }

  const currentUser = session.user.username || String(session.user.id) || "sync-api";

  try {
    const body: BulkSyncPayload = await req.json();
    const { scans, deviceId } = body;

    if (!scans || !Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No hay escaneos para sincronizar",
        },
        { status: 400 },
      );
    }

    if (scans.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: "Máximo 50 escaneos por sincronización",
        },
        { status: 400 },
      );
    }

    const results: SyncResultItem[] = [];

    // Process each scan in a transaction
    for (const scan of scans) {
      try {
        const result = await processSingleScan(scan, currentUser, deviceId);
        results.push(result);
      } catch (error) {
        console.error(`Error processing scan ${scan.id}:`, error);
        results.push({
          id: scan.id,
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
          conflictType: "server_error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failedCount === 0,
      results,
      serverTime: new Date().toISOString(),
      summary: {
        total: scans.length,
        synced: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error("Error in bulk sync:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}

async function processSingleScan(
  scan: ScanItem,
  currentUser: string,
  deviceId: string,
): Promise<SyncResultItem> {
  const { id, barcode, warehouseId, operation, quantity, timestamp } = scan;

  // Find product by barcode
  const productResult = await rawSql(
    `SELECT ProductID, ProductName FROM Products WHERE Barcode = @param0`,
    [barcode],
  );

  if (productResult.length === 0) {
    return {
      id,
      success: false,
      error: "Producto no encontrado",
      conflictType: "product_not_found",
    };
  }

  const product = productResult[0];

  // Find or create inventory record
  const inventoryResult = await rawSql(
    `SELECT InventoryID, QuantityOnHand FROM Inventory WHERE ProductID = @param0 AND WarehouseID = @param1`,
    [product.ProductID, warehouseId],
  );

  const inventoryExists = inventoryResult.length > 0;

  // Use transaction for atomic update
  return await withTransaction(async (transaction) => {
    let newQuantity = 0;
    let inventoryId: number;

    if (operation === "entrada") {
      if (inventoryExists) {
        const currentQty = inventoryResult[0].QuantityOnHand;
        newQuantity = currentQty + quantity;
        inventoryId = inventoryResult[0].InventoryID;

        await transaction
          .request()
          .input("qty", newQuantity)
          .input("invId", inventoryId)
          .query(
            `UPDATE Inventory SET QuantityOnHand = @qty, ModifiedDate = SYSDATETIME() WHERE InventoryID = @invId`,
          );
      } else {
        newQuantity = quantity;

        const insertResult = await transaction
          .request()
          .input("productId", product.ProductID)
          .input("warehouseId", warehouseId)
          .input("qty", newQuantity)
          .query(
            `INSERT INTO Inventory (ProductID, WarehouseID, QuantityOnHand, CreatedDate) 
             OUTPUT INSERTED.InventoryID
             VALUES (@productId, @warehouseId, @qty, SYSDATETIME())`,
          );
        inventoryId = insertResult.recordset[0].InventoryID;
      }

      // Log transaction
      await transaction
        .request()
        .input("invId", inventoryId)
        .input("qtyChange", quantity)
        .input(
          "notes",
          `Sincronizado desde dispositivo ${deviceId} - ${timestamp}`,
        )
        .input("createdBy", currentUser)
        .input("productId", product.ProductID)
        .query(
          `INSERT INTO dbo.InventoryTransactions 
           (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy, ProductID) 
           VALUES (@invId, 'RECEIPT', @qtyChange, NULL, @notes, @createdBy, @productId)`,
        );
    } else if (operation === "salida") {
      if (!inventoryExists) {
        return {
          id,
          success: false,
          error: "Producto no registrado en el almacén",
          conflictType: "product_not_found",
        };
      }

      const currentQty = inventoryResult[0].QuantityOnHand;
      inventoryId = inventoryResult[0].InventoryID;

      if (currentQty < quantity) {
        return {
          id,
          success: false,
          error: `Cantidad insuficiente. Disponible: ${currentQty}, Solicitado: ${quantity}`,
          conflictType: "negative_inventory",
          serverQuantity: currentQty,
        };
      }

      newQuantity = currentQty - quantity;

      await transaction
        .request()
        .input("qty", newQuantity)
        .input("invId", inventoryId)
        .query(
          `UPDATE Inventory SET QuantityOnHand = @qty, ModifiedDate = SYSDATETIME() WHERE InventoryID = @invId`,
        );

      // Log transaction
      await transaction
        .request()
        .input("invId", inventoryId)
        .input("qtyChange", -quantity)
        .input(
          "notes",
          `Sincronizado desde dispositivo ${deviceId} - ${timestamp}`,
        )
        .input("createdBy", currentUser)
        .input("productId", product.ProductID)
        .query(
          `INSERT INTO dbo.InventoryTransactions 
           (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy, ProductID) 
           VALUES (@invId, 'SHIPMENT', @qtyChange, NULL, @notes, @createdBy, @productId)`,
        );
    }

    return {
      id,
      success: true,
      serverQuantity: newQuantity,
    };
  });
}
