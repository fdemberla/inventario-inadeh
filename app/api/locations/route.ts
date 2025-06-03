import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql(
      "SELECT MainLocationID, Name, ShortName, Address FROM RegionalLocations",
      [],
    );
    return NextResponse.json({ locations: result });
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
