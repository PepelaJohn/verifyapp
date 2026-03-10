import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/models/License";
import { domainsMatch, normalizeDomain } from "@/lib/domain";

export const runtime = "nodejs";

/**
 * POST /api/verify
 *
 * Called by the WordPress plugin before every chatbot request.
 * Body: { licenseKey: string, domain: string }
 *
 * Security is enforced by license key + domain binding, not a shared secret.
 * The shared secret offered no real protection since it would be stored on
 * the user's WordPress site and readable by the site owner anyway.
 */
export async function POST(req: NextRequest) {
  // 1. Parse and validate body
  let body: { licenseKey?: string; domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ allowed: false, reason: "Invalid request body" }, { status: 400 });
  }

  const { licenseKey, domain } = body;

  if (!licenseKey || typeof licenseKey !== "string" || licenseKey.trim() === "") {
    return NextResponse.json({ allowed: false, reason: "Missing license key" }, { status: 400 });
  }

  if (!domain || typeof domain !== "string" || domain.trim() === "") {
    return NextResponse.json({ allowed: false, reason: "Missing domain" }, { status: 400 });
  }

  const normalizedIncoming = normalizeDomain(domain);

  // 3. Connect and find license
  await connectDB();
  const license = await License.findOne({ licenseKey: licenseKey.trim() });

  if (!license) {
    return NextResponse.json({ allowed: false, reason: "License not found" }, { status: 200 });
  }

  // 4. Status checks
  if (license.status === "revoked") {
    return NextResponse.json({ allowed: false, reason: "License has been revoked" }, { status: 200 });
  }

  if (license.status === "suspended") {
    return NextResponse.json({ allowed: false, reason: "License is suspended" }, { status: 200 });
  }

  // 5. Domain check
  if (!domainsMatch(license.domain, normalizedIncoming)) {
    return NextResponse.json(
      { allowed: false, reason: "Domain not authorized for this license" },
      { status: 200 }
    );
  }

  // 6. Daily usage check (reset counter if it's a new calendar day)
  const now = new Date();
  const lastReset = license.usageResetAt ? new Date(license.usageResetAt) : null;
  const isNewDay =
    !lastReset ||
    lastReset.toDateString() !== now.toDateString();

  if (isNewDay) {
    license.requestsToday = 0;
    license.usageResetAt = now;
  }

  if (license.dailyLimit > 0 && license.requestsToday >= license.dailyLimit) {
    return NextResponse.json(
      { allowed: false, reason: "Daily request limit reached" },
      { status: 200 }
    );
  }

  // 7. Increment usage counters
  license.requestsToday += 1;
  license.totalRequests += 1;
  license.lastRequestAt = now;
  await license.save();

  return NextResponse.json({ allowed: true }, { status: 200 });
}
