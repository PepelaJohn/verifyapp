import { connectDB } from "@/lib/db";
import { License } from "@/models/License";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import LicenseDetailClient from "./LicenseDetailClient";

export const dynamic = "force-dynamic";

export default async function LicenseDetailPage({ params }: { params: { id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.admin?.isLoggedIn) {
    redirect("/admin");
  }

  await connectDB();
  const raw = await License.findById(params.id).lean();

  if (!raw) notFound();

  const license = {
    _id: String(raw._id),
    licenseKey: raw.licenseKey,
    domain: raw.domain,
    status: raw.status,
    dailyLimit: raw.dailyLimit,
    requestsToday: raw.requestsToday,
    totalRequests: raw.totalRequests,
    lastRequestAt: raw.lastRequestAt ? raw.lastRequestAt.toISOString() : null,
    usageResetAt: raw.usageResetAt ? raw.usageResetAt.toISOString() : null,
    createdAt: raw.createdAt ? (raw.createdAt as Date).toISOString() : null,
    notes: raw.notes,
  };

  return <LicenseDetailClient license={license} />;
}
