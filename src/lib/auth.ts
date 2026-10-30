import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "meems_admin_session";

function getAdminConfiguration() {
  const username = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!username || !password || password.length < 15 || !secret || secret.length < 32) {
    return null;
  }

  return { username, password, secret };
}

export async function verifyAdminAuth(): Promise<boolean> {
  const config = getAdminConfiguration();
  if (!config) return false;

  const cookieStore = cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!session || !session.value) return false;
  return session.value === config.secret;
}

export function isAdminAuthConfigured(): boolean {
  return getAdminConfiguration() !== null;
}

export function validateAdminCredentials(username: string, pass: string): boolean {
  const config = getAdminConfiguration();
  if (!config) return false;
  return username.trim().toLowerCase() === config.username.trim().toLowerCase() &&
    pass === config.password;
}

export function getAdminCookieHeader() {
  const config = getAdminConfiguration();
  if (!config) {
    throw new Error("Admin authentication is not configured. Set ADMIN_USERNAME, an ADMIN_PASSWORD of at least 15 characters, and a 32-character ADMIN_SESSION_SECRET.");
  }

  return {
    name: ADMIN_COOKIE_NAME,
    value: config.secret,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}
