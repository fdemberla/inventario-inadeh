import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { rawSql } from "@/lib/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // --- Extract and validate basic fields ---
    const file = formData.get("image") as File | null;
    const productName = formData.get("productName")?.toString() || "";
    const sku = formData.get("sku")?.toString() || "";
    const description = formData.get("description")?.toString() || null;
    const categoryID = formData.get("categoryID")?.toString() || "";
    const barcode = formData.get("barcode")?.toString() || null;
    const cost = parseFloat(formData.get("cost")?.toString() || "0.00");
    const unitID = formData.get("unitID")?.toString()
      ? parseInt(formData.get("unitID")!.toString())
      : null;

    if (!productName || !categoryID) {
      return NextResponse.json(
        {
          message:
            "Faltan campos obligatorios: nombre del producto o categoría.",
        },
        { status: 400 },
      );
    }

    // --- Handle image upload ---
    let imageURL: string | null = null;
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { message: "Solo se permiten imágenes en formato JPEG, PNG o WEBP." },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const filename = `${crypto.randomUUID()}.webp`;
      const filePath = path.join(uploadDir, filename);

      await sharp(buffer)
        .resize({ width: 800 })
        .toFormat("webp")
        .toFile(filePath);
      imageURL = `/uploads/${filename}`;
    }

    // --- Check for duplicate SKU or Barcode ---
    if (barcode) {
      const checkUniqueQuery = `
        SELECT Barcode, ProductID, ProductName 
        FROM Products 
        WHERE Barcode = @param0
      `;
      const existingProducts = await rawSql(checkUniqueQuery, [barcode]);

      if (existingProducts && existingProducts.length > 0) {
        return NextResponse.json(
          {
            message: `Ya existe un producto con el código de barras "${barcode}".`,
          },
          { status: 400 },
        );
      }
    }

    // --- Insert Product and get new ID ---
    const insertProductQuery = `
      DECLARE @ProductID INT;
      INSERT INTO Products (InternalSKU, ProductName, Description, Barcode, CategoryID, ImageURL, Cost, UnitID)
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7);
      SET @ProductID = SCOPE_IDENTITY();
      SELECT @ProductID AS ProductID;
    `;
    const insertProductParams = [
      sku,
      productName,
      description,
      barcode,
      categoryID,
      imageURL,
      cost,
      unitID,
    ];
    const [productResult] = await rawSql(
      insertProductQuery,
      insertProductParams,
    );
    const productID = productResult?.ProductID;

    if (!productID) {
      throw new Error("No se pudo obtener el ID del producto recién creado.");
    }

    // --- Parse and insert suppliers ---
    const suppliersData = formData.getAll("suppliers");
    const suppliersJson = suppliersData[suppliersData.length - 1]?.toString();

    if (!suppliersJson) {
      return NextResponse.json(
        { message: "No se proporcionó la información de proveedores." },
        { status: 400 },
      );
    }

    let suppliers;
    try {
      suppliers = JSON.parse(suppliersJson);
    } catch (err) {
      return NextResponse.json(
        {
          message: "Formato de proveedores inválido. Debe ser un JSON válido.",
          err: err,
        },
        { status: 400 },
      );
    }

    for (const supplier of suppliers) {
      const insertSupplierQuery = `
        INSERT INTO ProductSuppliers
          (ProductID, SupplierID, SupplierSKU, LeadTimeDays, Cost, IsPrimarySupplier)
        VALUES
          (@param0, @param1, @param2, @param3, @param4, @param5);
      `;
      const insertSupplierParams = [
        productID,
        supplier.supplierID,
        supplier.supplierSKU,
        supplier.leadTimeDays,
        supplier.cost,
        supplier.isPrimarySupplier,
      ];
      await rawSql(insertSupplierQuery, insertSupplierParams);
    }

    return NextResponse.json({
      message: "Producto y proveedores creados exitosamente.",
    });
  } catch (err: unknown) {
    console.error("Error creating product with suppliers:", err);

    let message = "Ocurrió un error al crear el producto.";

    if (typeof err.message === "string") {
      if (err.message.includes("UNIQUE KEY constraint")) {
        if (err.message.includes("UQ__Products__177800D3")) {
          message = "El SKU interno ya está registrado. Usa uno diferente.";
        } else if (err.message.includes("Barcode")) {
          message = "El código de barras ya está registrado.";
        }
      } else if (err.message.includes("conversion failed")) {
        message = "Uno de los campos tiene un formato inválido.";
      }
    }

    return NextResponse.json({ message }, { status: 400 });
  }
}
