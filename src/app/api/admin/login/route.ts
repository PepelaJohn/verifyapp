import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { sessionOptions, type SessionData } from "@/lib/session";

export const runtime = "nodejs";

/**
 * POST /api/admin/login
 * Body: { username: string, password: string }
 */
export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const usernameMatch = username === adminUsername;
  // Use bcrypt compare if password is stored hashed; plain compare for MVP env var
  const passwordMatch = password === adminPassword;

  if (!usernameMatch || !passwordMatch) {
    // Artificial delay to slow brute-force attempts
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.admin = { isLoggedIn: true, username: adminUsername };
  await session.save();

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/admin/login — logout
 */
export async function DELETE() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.destroy();
  return NextResponse.json({ ok: true });
}
