import mongoose, { Schema, Document, Model } from "mongoose";

export type LicenseStatus = "active" | "suspended" | "revoked";

export interface ILicense extends Document {
  licenseKey: string;
  domain: string;            // normalized domain this license is bound to
  status: LicenseStatus;
  dailyLimit: number;        // max requests per calendar day (0 = unlimited)
  requestsToday: number;     // resets each calendar day
  totalRequests: number;
  lastRequestAt: Date | null;
  usageResetAt: Date | null; // last time requestsToday was reset
  createdAt: Date;
  updatedAt: Date;
  notes: string;             // optional admin notes
}

const LicenseSchema = new Schema<ILicense>(
  {
    licenseKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "revoked"],
      default: "active",
    },
    dailyLimit: {
      type: Number,
      default: 0, // 0 means no daily limit enforced
    },
    requestsToday: {
      type: Number,
      default: 0,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    lastRequestAt: {
      type: Date,
      default: null,
    },
    usageResetAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Prevent model re-compilation in Next.js hot-reload
export const License: Model<ILicense> =
  mongoose.models.License ?? mongoose.model<ILicense>("License", LicenseSchema);
