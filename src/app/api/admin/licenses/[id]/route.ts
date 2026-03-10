import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/models/License";
import { normalizeDomain } from "@/lib/domain";
import { requireAdmin } from "@/middleware/auth";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

/**
 * GET /api/admin/licenses/[id]
 * Returns a single license by MongoDB _id.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connectDB();
  const license = await License.findById(params.id).lean();

  if (!license) {
    return NextResponse.json({ error: "License not found" }, { status: 404 });
  }

  return NextResponse.json({ license });
}

/**
 * PATCH /api/admin/licenses/[id]
 * Updates allowed fields on a license.
 *
 * Supported body fields:
 *   status: "active" | "suspended" | "revoked"
 *   domain: string
 *   dailyLimit: number
 *   notes: string
 *   resetUsage: true  — resets requestsToday and totalRequests
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await connectDB();
  const license = await License.findById(params.id);

  if (!license) {
    return NextResponse.json({ error: "License not found" }, { status: 404 });
  }

  // Apply allowed updates
  if (body.status !== undefined) {
    const validStatuses = ["active", "suspended", "revoked"];
    if (!validStatuses.includes(String(body.status))) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    license.status = body.status as "active" | "suspended" | "revoked";
  }

  if (body.domain !== undefined) {
    const normalized = normalizeDomain(String(body.domain));
    if (!normalized) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }
    license.domain = normalized;
  }

  if (body.dailyLimit !== undefined) {
    license.dailyLimit = Math.max(0, Number(body.dailyLimit) || 0);
  }

  if (body.notes !== undefined) {
    license.notes = String(body.notes).slice(0, 500);
  }

  if (body.resetUsage === true) {
    license.requestsToday = 0;
    license.totalRequests = 0;
    license.usageResetAt = new Date();
  }

  await license.save();

  return NextResponse.json({ license });
}

/**
 * DELETE /api/admin/licenses/[id]
 * Permanently deletes a license.
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connectDB();
  const result = await License.findByIdAndDelete(params.id);

  if (!result) {
    return NextResponse.json({ error: "License not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
