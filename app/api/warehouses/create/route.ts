import { NextResponse } from "next/server";
import { sql } from "@/lib/db"; // make sure this helper uses mssql

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { WarehouseName, Location, IsActive, MainLocationID, WarehouseCode } =
      body;

    if (!WarehouseName || !MainLocationID) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get ShortName for the selected location
    const result = await sql(
      `
      SELECT ShortName
      FROM RegionalLocations
      WHERE MainLocationID = @param0
    `,
      [MainLocationID],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invalid MainLocationID" },
        { status: 400 },
      );
    }

    const insertParams = [
      WarehouseCode,
      WarehouseName,
      Location || null,
      IsActive ? 1 : 0,
      MainLocationID,
    ];

    // Insert into Warehouses table
    await sql(
      `
      INSERT INTO Warehouses (
        WarehouseCode,
        WarehouseName,
        Location,
        IsActive,
        CreatedDate,
        MainLocationID
      )
      VALUES (
        @param0,
        @param1,
        @param2,
        @param3,
        SYSUTCDATETIME(),
        @param4
      )
    `,
      insertParams,
    );

    return NextResponse.json({ success: true, WarehouseCode }, { status: 201 });
  } catch (err) {
    console.error("Error creating warehouse:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
