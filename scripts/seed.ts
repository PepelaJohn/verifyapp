/**
 * Seed script — creates a test license in MongoDB.
 *
 * Usage:
 *   1. Copy .env.local.example to .env.local and fill in MONGODB_URI
 *   2. Run: npm run seed
 *
 * This script uses ts-node with tsconfig.seed.json.
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Check your .env.local file.");
  process.exit(1);
}

// Inline minimal schema here to avoid Next.js module resolution issues in ts-node
const LicenseSchema = new mongoose.Schema(
  {
    licenseKey: { type: String, required: true, unique: true },
    domain: { type: String, required: true },
    status: { type: String, default: "active" },
    dailyLimit: { type: Number, default: 0 },
    requestsToday: { type: Number, default: 0 },
    totalRequests: { type: Number, default: 0 },
    lastRequestAt: { type: Date, default: null },
    usageResetAt: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const License = mongoose.model("License", LicenseSchema);

  // Remove existing test license if present
  await License.deleteOne({ licenseKey: "LIC-TESTKEY0000001" });

  const license = await License.create({
    licenseKey: "LIC-TESTKEY0000001",
    domain: "localhost",          // change to your test domain
    status: "active",
    dailyLimit: 100,
    notes: "Test license — created by seed script",
  });

  console.log("✅ Test license created:");
  console.log(`   Key:    ${license.licenseKey}`);
  console.log(`   Domain: ${license.domain}`);
  console.log(`   Status: ${license.status}`);
  console.log(`   Limit:  ${license.dailyLimit} req/day`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
