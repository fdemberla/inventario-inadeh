import { sql } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getApiAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getApiAuth(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const result = await sql(
      `SELECT * FROM Suppliers WHERE IsActive = 1 ORDER BY CreatedDate DESC`,
      [],
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Error fetching suppliers." },
      { status: 500 },
    );
  }
}
