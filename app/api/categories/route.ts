import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getApiAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getApiAuth(req);
    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const query = `
      SELECT CategoryID, CategoryName, Description 
      FROM dbo.Categories 
      ORDER BY CategoryName
    `;
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
