import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { NextResponse } from "next/server";

/**
 * Returns the current session data.
 * Use in route handlers to check admin authentication.
 */
export async function getSession(): Promise<SessionData> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

/**
 * Returns a 401 response if the admin is not authenticated.
 * Usage: const authError = await requireAdmin(); if (authError) return authError;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session.admin?.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
