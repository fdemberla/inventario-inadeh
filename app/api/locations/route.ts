import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getApiAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getApiAuth(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
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
