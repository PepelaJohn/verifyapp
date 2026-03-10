"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type License = {
  _id: string;
  licenseKey: string;
  domain: string;
  status: "active" | "suspended" | "revoked";
  dailyLimit: number;
  requestsToday: number;
  totalRequests: number;
  lastRequestAt: string | null;
  usageResetAt: string | null;
  createdAt: string | null;
  notes: string;
};

const STATUS_COLORS: Record<string, string> = {
  active: "#16a34a",
  suspended: "#d97706",
  revoked: "#dc2626",
};

export default function LicenseDetailClient({ license: initial }: { license: License }) {
  const router = useRouter();
  const [lic, setLic] = useState<License>(initial);
  const [editDomain, setEditDomain] = useState(initial.domain);
  const [editLimit, setEditLimit] = useState(String(initial.dailyLimit));
  const [editNotes, setEditNotes] = useState(initial.notes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/licenses/${lic._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage("Error: " + (data.error || "Unknown"));
      } else {
        setLic(data.license);
        setEditDomain(data.license.domain);
        setEditLimit(String(data.license.dailyLimit));
        setEditNotes(data.license.notes);
        setMessage("Saved.");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Permanently delete this license? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/licenses/${lic._id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/licenses");
      router.refresh();
    } else {
      setMessage("Delete failed");
    }
  }

  function fmt(iso: string | null) {
    return iso ? new Date(iso).toLocaleString() : "—";
  }

  return (
    <div style={s.page}>
      <div style={s.breadcrumb}>
        <Link href="/admin/licenses">← All Licenses</Link>
      </div>

      <div style={s.card}>
        <div style={s.header}>
          <div>
            <h2 style={s.heading}>License Detail</h2>
            <code style={s.keyDisplay}>{lic.licenseKey}</code>
          </div>
          <span style={{ ...s.badge, background: STATUS_COLORS[lic.status] + "22", color: STATUS_COLORS[lic.status] }}>
            {lic.status}
          </span>
        </div>

        <div style={s.grid}>
          <Stat label="Requests Today" value={lic.requestsToday} />
          <Stat label="Total Requests" value={lic.totalRequests} />
          <Stat label="Daily Limit" value={lic.dailyLimit === 0 ? "Unlimited" : lic.dailyLimit} />
          <Stat label="Last Request" value={fmt(lic.lastRequestAt)} />
          <Stat label="Created" value={fmt(lic.createdAt)} />
          <Stat label="Usage Reset At" value={fmt(lic.usageResetAt)} />
        </div>
      </div>

      {/* Edit section */}
      <div style={s.card}>
        <h3 style={s.sectionTitle}>Edit License</h3>
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.label}>Bound Domain</label>
            <input style={s.input} value={editDomain} onChange={(e) => setEditDomain(e.target.value)} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Daily Limit (0 = unlimited)</label>
            <input style={{ ...s.input, width: "120px" }} type="number" min="0" value={editLimit}
              onChange={(e) => setEditLimit(e.target.value)} />
          </div>
          <div style={{ ...s.formGroup, flex: 2 }}>
            <label style={s.label}>Notes</label>
            <input style={s.input} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
          </div>
        </div>
        <button
          style={s.btnPrimary}
          disabled={saving}
          onClick={() => patch({ domain: editDomain, dailyLimit: Number(editLimit), notes: editNotes })}
        >
          Save Changes
        </button>
      </div>

      {/* Actions section */}
      <div style={s.card}>
        <h3 style={s.sectionTitle}>Actions</h3>
        <div style={s.actionRow}>
          <button style={s.btnGreen} disabled={saving || lic.status === "active"} onClick={() => patch({ status: "active" })}>
            ✓ Reactivate
          </button>
          <button style={s.btnOrange} disabled={saving || lic.status === "suspended"} onClick={() => patch({ status: "suspended" })}>
            ⏸ Suspend
          </button>
          <button style={s.btnRed} disabled={saving || lic.status === "revoked"} onClick={() => patch({ status: "revoked" })}>
            ✗ Revoke
          </button>
          <button style={s.btnSecondary} disabled={saving} onClick={() => patch({ resetUsage: true })}>
            ↺ Reset Usage
          </button>
          <button style={{ ...s.btnRed, marginLeft: "auto" }} disabled={saving} onClick={handleDelete}>
            🗑 Delete License
          </button>
        </div>
      </div>

      {message && <p style={{ marginTop: "1rem", color: message.startsWith("Error") ? "#dc2626" : "#16a34a" }}>{message}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
      <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: 500, textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{String(value)}</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: "800px", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  breadcrumb: { marginBottom: "0.25rem" },
  card: { background: "#fff", borderRadius: "8px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" },
  heading: { fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.3rem" },
  keyDisplay: { background: "#f1f5f9", padding: "0.25rem 0.6rem", borderRadius: "4px", fontSize: "0.85rem" },
  badge: { padding: "0.25rem 0.75rem", borderRadius: "999px", fontWeight: 600, fontSize: "0.85rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" },
  sectionTitle: { fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" },
  formRow: { display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1, minWidth: "160px" },
  label: { fontSize: "0.8rem", fontWeight: 500, color: "#555" },
  input: { padding: "0.45rem 0.7rem", border: "1px solid #ccc", borderRadius: "4px", fontSize: "0.9rem", width: "100%" },
  actionRow: { display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" },
  btnPrimary: { padding: "0.45rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600 },
  btnSecondary: { padding: "0.45rem 1rem", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", fontWeight: 500 },
  btnGreen: { padding: "0.45rem 1rem", background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "4px", cursor: "pointer", fontWeight: 600 },
  btnOrange: { padding: "0.45rem 1rem", background: "#fff7ed", color: "#d97706", border: "1px solid #fed7aa", borderRadius: "4px", cursor: "pointer", fontWeight: 600 },
  btnRed: { padding: "0.45rem 1rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "4px", cursor: "pointer", fontWeight: 600 },
};
