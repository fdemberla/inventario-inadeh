// app/api/inventory/update/route.ts
import { NextResponse } from "next/server";
import { rawSql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const {
      productId,
      warehouseId,
      newQuantity,
      notes,
      referenceNumber,
      updateType = "insert",
      quantityReserved = 0,
      reorderLevel = null,
      lastStockedDate = null,
      createdBy = "WEB_USER",
    } = await request.json();

    // Validate required fields
    if (!productId || !warehouseId || newQuantity === undefined) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (productId, warehouseId, newQuantity)",
        },
        { status: 400 },
      );
    }

    if (updateType === "table") {
      // Get current inventory data - outside transaction
      const currentInventory = await rawSql<{
        InventoryID: number;
        QuantityOnHand: number;
      }>(
        `SELECT InventoryID, QuantityOnHand 
         FROM inventario.dbo.Inventory 
         WHERE ProductID = @param0 AND WarehouseID = @param1`,
        [productId, warehouseId],
      );

      if (!currentInventory || currentInventory.length === 0) {
        return NextResponse.json(
          { error: "Inventory record not found for update" },
          { status: 404 },
        );
      }

      const { InventoryID, QuantityOnHand: currentQty } = currentInventory[0];
      const quantityChange = newQuantity - currentQty;

      // Execute all operations in a single query batch to maintain transaction
      const transactionQuery = `
        BEGIN TRY
          BEGIN TRANSACTION;
          
          -- Update inventory record
          UPDATE inventario.dbo.Inventory
          SET QuantityOnHand = @param0,
              ModifiedDate = CURRENT_TIMESTAMP
          WHERE InventoryID = @param1;
          
          -- Create inventory transaction record
          INSERT INTO inventario.dbo.InventoryTransactions (
            InventoryID,
            TransactionType,
            QuantityChange,
            ReferenceNumber,
            Notes,
            CreatedBy
          ) VALUES (
            @param1, @param2, @param3, @param4, @param5, @param6
          );
          
          COMMIT TRANSACTION;
          
          SELECT 'SUCCESS' AS Status;
        END TRY
        BEGIN CATCH
          ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `;

      const result = await rawSql(transactionQuery, [
        newQuantity, // @param0
        InventoryID, // @param1
        "ADJUSTMENT", // @param2
        quantityChange, // @param3
        referenceNumber || `WEB-ADJ-${Date.now()}`, // @param4
        notes || `Manual adjustment from ${currentQty} to ${newQuantity}`, // @param5
        createdBy, // @param6
      ]);

      return NextResponse.json(
        { message: "Inventory updated successfully", result: result },
        { status: 200 },
      );
    } else {
      // Insert new inventory record as a single transaction batch
      const insertTransactionQuery = `
        BEGIN TRY
          BEGIN TRANSACTION;
          
          -- Insert inventory record
          INSERT INTO inventario.dbo.Inventory (
            ProductID,
            WarehouseID,
            QuantityOnHand,
            QuantityReserved,
            ReorderLevel,
            LastStockedDate,
            ModifiedDate
          ) 
          OUTPUT INSERTED.InventoryID
          VALUES (
            @param0, @param1, @param2, @param3, 
            @param4, @param5, CURRENT_TIMESTAMP
          );
          
          -- Create inventory transaction record
          INSERT INTO inventario.dbo.InventoryTransactions (
            InventoryID,
            TransactionType,
            QuantityChange,
            ReferenceNumber,
            Notes,
            CreatedBy
          ) VALUES (
            SCOPE_IDENTITY(), @param6, @param2, @param7, @param8, @param9
          );
          
          COMMIT TRANSACTION;
          
          SELECT SCOPE_IDENTITY() AS NewInventoryID;
        END TRY
        BEGIN CATCH
          ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `;

      const insertResult = await rawSql<{ NewInventoryID: number }>(
        insertTransactionQuery,
        [
          productId, // @param0
          warehouseId, // @param1
          newQuantity, // @param2
          quantityReserved, // @param3
          reorderLevel, // @param4
          lastStockedDate ? new Date(lastStockedDate).toISOString() : null, // @param5
          "RECEIPT", // @param6
          referenceNumber || `WEB-INIT-${Date.now()}`, // @param7
          notes || "Initial inventory creation", // @param8
          createdBy, // @param9
        ],
      );

      if (!insertResult || insertResult.length === 0) {
        throw new Error("Failed to retrieve new InventoryID");
      }

      return NextResponse.json(
        {
          message: "Inventory added successfully",
          inventoryId: insertResult[0].NewInventoryID,
        },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error("Error processing inventory update:", error);
    return NextResponse.json(
      {
        error: "Failed to process inventory update",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
