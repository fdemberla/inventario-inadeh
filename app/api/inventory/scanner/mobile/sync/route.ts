// app/api/inventory/scanner/mobile/sync/route.ts
// Bulk sync endpoint for offline scans
import { NextRequest, NextResponse } from "next/server";
import { rawSql, withTransaction } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";

interface MobileScanItem {
  id: number;
  barcode: string;
  warehouseId: number;
  operation: "entrada" | "salida";
  quantity: number;
  timestamp: string;
  deviceId: string;
}

interface MobileSyncPayload {
  scans: MobileScanItem[];
  deviceId: string;
}

interface SyncResultItem {
  id: number;
  success: boolean;
  message?: string;
  error?: string;
  conflictType?: string;
  serverQuantity?: number;
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

    const { scans, deviceId } = body as Partial<MobileSyncPayload>;

    if (!scans || !Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No hay escaneos para sincronizar",
        },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (scans.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Máximo 100 escaneos por sincronización",
        },
        { status: 400 }
      );
    }

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "deviceId es requerido",
        },
        { status: 400 }
      );
    }

    const results: SyncResultItem[] = [];
    const createdBy = session.username || `user_${session.id}`;

    // Process each scan
    for (const scan of scans) {
      try {
        const result = await processMobileScan(
          scan,
          createdBy,
          deviceId
        );
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
      userId: session.id,
      username: session.username,
    });
  } catch (error) {
    console.error("Error in mobile bulk sync:", error);
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

async function processMobileScan(
  scan: MobileScanItem,
  createdBy: string,
  deviceId: string
): Promise<SyncResultItem> {
  const { id, barcode, warehouseId, operation, quantity, timestamp } = scan;

  // Validate scan data
  if (!barcode || !warehouseId || !operation || !quantity) {
    return {
      id,
      success: false,
      error: "Datos incompletos del escaneo",
      conflictType: "invalid_data",
    };
  }

  if (!["entrada", "salida"].includes(operation)) {
    return {
      id,
      success: false,
      error: "Operación inválida",
      conflictType: "invalid_operation",
    };
  }

  if (quantity <= 0) {
    return {
      id,
      success: false,
      error: "Cantidad debe ser mayor a 0",
      conflictType: "invalid_quantity",
    };
  }

  // Find product by barcode
  const productResult = await rawSql(
    `SELECT ProductID, ProductName FROM Products WHERE Barcode = @param0`,
    [barcode]
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

  // Get current inventory
  const inventoryResult = await rawSql(
    `SELECT InventoryID, QuantityOnHand FROM Inventory WHERE ProductID = @param0 AND WarehouseID = @param1`,
    [product.ProductID, warehouseId]
  );

  const inventoryExists = inventoryResult.length > 0;

  // Use transaction for atomic update
  return (await withTransaction(async (transaction) => {
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
            `UPDATE Inventory SET QuantityOnHand = @qty, ModifiedDate = SYSDATETIME() WHERE InventoryID = @invId`
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
             VALUES (@productId, @warehouseId, @qty, SYSDATETIME())`
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
          `Sincronizado desde dispositivo ${deviceId} - ${timestamp}`
        )
        .input("createdBy", createdBy)
        .input("productId", product.ProductID)
        .query(
          `INSERT INTO dbo.InventoryTransactions 
           (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy, ProductID) 
           VALUES (@invId, 'RECEIPT', @qtyChange, NULL, @notes, @createdBy, @productId)`
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
          `UPDATE Inventory SET QuantityOnHand = @qty, ModifiedDate = SYSDATETIME() WHERE InventoryID = @invId`
        );

      // Log transaction
      await transaction
        .request()
        .input("invId", inventoryId)
        .input("qtyChange", -quantity)
        .input(
          "notes",
          `Sincronizado desde dispositivo ${deviceId} - ${timestamp}`
        )
        .input("createdBy", createdBy)
        .input("productId", product.ProductID)
        .query(
          `INSERT INTO dbo.InventoryTransactions 
           (InventoryID, TransactionType, QuantityChange, ReferenceNumber, Notes, CreatedBy, ProductID) 
           VALUES (@invId, 'SHIPMENT', @qtyChange, NULL, @notes, @createdBy, @productId)`
        );
    }

    return {
      id,
      success: true,
      message: `${product.ProductName} (${operation}) - Nueva cantidad: ${newQuantity}`,
      serverQuantity: newQuantity,
    } as SyncResultItem;
  })) as SyncResultItem;
}

// Reject other methods
export async function GET() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}
