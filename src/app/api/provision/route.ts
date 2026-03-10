import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/models/License";
import { normalizeDomain } from "@/lib/domain";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

/**
 * POST /api/provision
 *
 * Called by Google Apps Script (not the WordPress plugin, not the browser).
 * Creates a new license for a given domain and returns the key.
 *
 * Protected by PROVISION_SECRET env var — only Apps Script knows this.
 * This secret is safe here because it lives in Google Apps Script's
 * Script Properties (server-side), not in any user-facing code.
 *
 * Body: {
 *   domain:     string   — the site domain to bind the license to
 *   email:      string   — customer email (stored in notes for your reference)
 *   name:       string   — customer name
 *   dailyLimit: number   — optional, defaults to 0 (unlimited)
 * }
 */
export async function POST(req: NextRequest) {
  // Validate the provisioning secret
  const secret = req.headers.get("x-provision-secret");
  if (!secret || secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    domain?: string;
    email?: string;
    name?: string;
    dailyLimit?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { domain, email, name, dailyLimit = 0 } = body;

  if (!domain || typeof domain !== "string" || domain.trim() === "") {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  await connectDB();

  // Check if this domain already has an active license
  const existing = await License.findOne({ domain: normalized, status: "active" });
  if (existing) {
    // Return the existing key rather than creating a duplicate
    return NextResponse.json({
      licenseKey: existing.licenseKey,
      domain: existing.domain,
      alreadyExisted: true,
    });
  }

  const licenseKey = "LIC-" + nanoid(16).toUpperCase();

  const license = await License.create({
    licenseKey,
    domain: normalized,
    status: "active",
    dailyLimit: Math.max(0, Number(dailyLimit) || 0),
    notes: `Auto-provisioned | Name: ${String(name || "").slice(0, 100)} | Email: ${String(email).slice(0, 200)}`,
  });

  return NextResponse.json({
    licenseKey: license.licenseKey,
    domain: license.domain,
    alreadyExisted: false,
  }, { status: 201 });
}
