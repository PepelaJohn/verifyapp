import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/models/License";
import { normalizeDomain } from "@/lib/domain";
import { requireAdmin } from "@/middleware/auth";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

/**
 * GET /api/admin/licenses
 * Returns all licenses, sorted by creation date descending.
 */
export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connectDB();
  const licenses = await License.find({}).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ licenses });
}

/**
 * POST /api/admin/licenses
 * Creates a new license.
 * Body: { domain: string, dailyLimit?: number, notes?: string }
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: { domain?: string; dailyLimit?: number; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { domain, dailyLimit = 0, notes = "" } = body;

  if (!domain || typeof domain !== "string" || domain.trim() === "") {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  await connectDB();

  // Generate a unique license key: LIC-<16 random chars>
  const licenseKey = "LIC-" + nanoid(16).toUpperCase();

  const license = await License.create({
    licenseKey,
    domain: normalized,
    status: "active",
    dailyLimit: Math.max(0, Number(dailyLimit) || 0),
    notes: String(notes).slice(0, 500),
  });

  return NextResponse.json({ license }, { status: 201 });
}
