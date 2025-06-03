import { NextResponse } from "next/server";
import { sql } from "@/lib/db"; // Adjust based on your db helper

export async function GET() {
  try {
    // Correctly pass query as string, not template literal
    const query =
      "SELECT CategoryID, CategoryName FROM Categories ORDER BY CategoryName";
    const result = await sql(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching categories." },
      { status: 500 },
    );
  }
}
