import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql(
      `SELECT * FROM Suppliers WHERE IsActive = 1 ORDER BY CreatedDate DESC`,
      [],
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching suppliers.", error_details: error },
      { status: 500 },
    );
  }
}
