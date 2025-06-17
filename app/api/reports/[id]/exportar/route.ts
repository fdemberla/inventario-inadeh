import { NextResponse, NextRequest } from "next/server";
import { rawSql } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid Warehouse ID" },
        { status: 400 },
      );
    }

    const query = `
        SELECT 
            prod.Barcode AS CodigoDeBarras,
            prod.InternalSKU AS CodigoISTMO,
            prod.ProductName AS Nombre,
            prod.Description AS Descripcion,
            cat.CategoryName AS Categoria,
            war.WarehouseCode AS CodigoDeposito,
            war.WarehouseName AS NombreDeposito,
            inv.QuantityOnHand AS CantidadEnDeposito,
            inv.ReorderLevel AS NivelDeReorden,
            CASE 
                WHEN inv.QuantityOnHand <= inv.ReorderLevel THEN 'Bajo'
                ELSE 'Normal'
            END AS EstadoInventario
        FROM [dbo].[Inventory] inv
        LEFT JOIN dbo.Warehouses war ON inv.WarehouseID = war.WarehouseID
        LEFT JOIN dbo.Products prod ON inv.ProductID = prod.ProductID
        LEFT JOIN dbo.Categories cat ON prod.CategoryID = cat.CategoryID
        WHERE inv.WarehouseID = @param0
        ORDER BY cat.CategoryName, prod.ProductName
    `;

    const result = await rawSql(query, [id]);

    if (result.length === 0) {
      return NextResponse.json(
        { message: "No inventory found for this warehouse" },
        { status: 404 },
      );
    }

    // Crear un nuevo workbook
    const workbook = XLSX.utils.book_new();

    // Crear worksheet vacío
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Agregar metadatos en las primeras filas
    const warehouseName = result[0]?.NombreDeposito || `Depósito ${id}`;
    const currentDate = new Date().toLocaleDateString("es-ES");

    // Insertar filas de encabezado
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [`Reporte de Inventario - ${warehouseName}`],
        [`Fecha de Exportación: ${currentDate}`],
        [`Total de Productos: ${result.length}`],
        [], // Fila vacía
      ],
      { origin: "A1" },
    );

    // Agregar los datos del inventario empezando en A5
    XLSX.utils.sheet_add_json(worksheet, result, {
      origin: "A5",
      skipHeader: false,
    });

    // Configurar el ancho de las columnas
    const columnWidths = [
      { wch: 15 }, // CodigoDeBarras
      { wch: 12 }, // CodigoISTMO
      { wch: 30 }, // Nombre
      { wch: 40 }, // Descripcion
      { wch: 20 }, // Categoria
      { wch: 15 }, // CodigoDeposito
      { wch: 25 }, // NombreDeposito
      { wch: 18 }, // CantidadEnDeposito
      { wch: 15 }, // NivelDeReorden
      { wch: 18 }, // EstadoInventario
    ];
    worksheet["!cols"] = columnWidths;

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

    // Generar el buffer del archivo Excel
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Crear el nombre del archivo
    const fileName = `inventario_deposito_${id}_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Configurar las cabeceras para la descarga
    const headers = new Headers();
    headers.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    headers.set("Content-Length", excelBuffer.length.toString());

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error("Error generating Excel export:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
