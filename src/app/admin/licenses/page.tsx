import { connectDB } from "@/lib/db";
import { License, ILicense } from "@/models/License";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { redirect } from "next/navigation";
import LicensesClient from "./LicensesClient";

export const dynamic = "force-dynamic";

export default async function LicensesPage() {
  // Server-side auth check
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.admin?.isLoggedIn) {
    redirect("/admin");
  }

  await connectDB();
  const raw = await License.find({}).sort({ createdAt: -1 }).lean();

  // Serialize for client component
  const licenses = raw.map((l) => ({
    _id: String(l._id),
    licenseKey: l.licenseKey,
    domain: l.domain,
    status: l.status,
    dailyLimit: l.dailyLimit,
    requestsToday: l.requestsToday,
    totalRequests: l.totalRequests,
    lastRequestAt: l.lastRequestAt ? l.lastRequestAt.toISOString() : null,
    createdAt: l.createdAt ? (l.createdAt as Date).toISOString() : null,
    notes: l.notes,
  }));

  return <LicensesClient initialLicenses={licenses} />;
}
