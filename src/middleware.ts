import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "meems_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const adminUsername = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  const isConfigured =
    Boolean(adminUsername) &&
    Boolean(adminPassword && adminPassword.length >= 15) &&
    Boolean(sessionSecret && sessionSecret.length >= 32);

  if (!isConfigured) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Admin authentication is not configured." },
        { status: 503 }
      );
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (request.cookies.get(ADMIN_COOKIE_NAME)?.value !== sessionSecret) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
