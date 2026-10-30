import { NextResponse } from "next/server";
import {
  getAdminCookieHeader,
  isAdminAuthConfigured,
  validateAdminCredentials,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!isAdminAuthConfigured()) {
      return NextResponse.json(
        { error: "Admin sign-in is not configured. Set the required server environment variables." },
        { status: 503 }
      );
    }

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const isValid = validateAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid administrator username or password" },
        { status: 401 }
      );
    }

    const cookieInfo = getAdminCookieHeader();
    const response = NextResponse.json({
      success: true,
      message: "Admin session authenticated successfully",
    });

    response.cookies.set(cookieInfo.name, cookieInfo.value, cookieInfo.options);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
