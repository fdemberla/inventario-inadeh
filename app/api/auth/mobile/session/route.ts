// app/api/auth/mobile/session/route.ts
// Mobile session validation endpoint - verifies Bearer token
import { NextRequest, NextResponse } from "next/server";
import { getMobileSession } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    // Get and verify the mobile session from Bearer token
    const session = await getMobileSession(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Return user session data
    return NextResponse.json({
      success: true,
      user: {
        id: session.id,
        username: session.username,
        role: session.role,
        firstName: session.firstName,
        lastName: session.lastName,
        email: session.email,
      },
    });
  } catch (error) {
    console.error("Mobile session verification error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 }
    );
  }
}

// Reject other methods
export async function POST() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}
