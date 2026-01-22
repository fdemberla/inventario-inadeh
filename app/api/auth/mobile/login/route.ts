// app/api/auth/mobile/login/route.ts
// Mobile login endpoint - returns JWT in response body
import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/login";
import { signMobileToken, sanitizeForLog } from "@/lib/mobile-auth";

// Request body interface
interface LoginRequestBody {
  username: string;
  password: string;
}

// Validate request body
function validateRequestBody(body: unknown): body is LoginRequestBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const { username, password } = body as Record<string, unknown>;
  return typeof username === "string" && typeof password === "string";
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate request body
    if (!validateRequestBody(body)) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    const { username, password } = body;

    // Validate input lengths to prevent abuse
    if (username.length > 100 || password.length > 200) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials format" },
        { status: 400 }
      );
    }

    // Attempt login using existing loginUser function
    const result = await loginUser(username, password);

    if (!result.success || !result.user) {
      // Log failed attempt (sanitized)
      console.warn(
        `Mobile login failed for user: ${sanitizeForLog(username)}`
      );
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = result.user;

    // Create user payload for token
    const userPayload = {
      id: user.UserID,
      username: user.Username,
      role: user.RoleID,
      firstName: user.FirstName,
      lastName: user.LastName,
      email: user.Email,
    };

    // Sign JWT token
    const token = await signMobileToken(userPayload);

    // Return token and user info (excluding sensitive data)
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userPayload.id,
        username: userPayload.username,
        role: userPayload.role,
        firstName: userPayload.firstName,
        lastName: userPayload.lastName,
        email: userPayload.email,
      },
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during login" },
      { status: 500 }
    );
  }
}

// Reject other methods
export async function GET() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}
