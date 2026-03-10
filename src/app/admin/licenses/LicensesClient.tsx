"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type License = {
  _id: string;
  licenseKey: string;
  domain: string;
  status: "active" | "suspended" | "revoked";
  dailyLimit: number;
  requestsToday: number;
  totalRequests: number;
  lastRequestAt: string | null;
  createdAt: string | null;
  notes: string;
};

const STATUS_COLORS: Record<string, string> = {
  active: "#16a34a",
  suspended: "#d97706",
  revoked: "#dc2626",
};

export default function LicensesClient({ initialLicenses }: { initialLicenses: License[] }) {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>(initialLicenses);
  const [showCreate, setShowCreate] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newLimit, setNewLimit] = useState("0");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, dailyLimit: Number(newLimit), notes: newNotes }),
      });

      if (!res.ok) {
        const d = await res.json();
        setCreateError(d.error || "Failed to create");
        return;
      }

      const data = await res.json();
      setLicenses([data.license, ...licenses]);
      setNewDomain("");
      setNewLimit("0");
      setNewNotes("");
      setShowCreate(false);
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <span style={s.title}>🔑 License Manager</span>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button style={s.btnSecondary} onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "+ New License"}
          </button>
          <button style={s.btnSecondary} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {showCreate && (
        <div style={s.createBox}>
          <h3 style={{ marginBottom: "1rem" }}>Create New License</h3>
          <form onSubmit={handleCreate} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={s.label}>Domain *</label>
              <input
                style={s.input}
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={s.label}>Daily Limit (0 = unlimited)</label>
              <input
                style={{ ...s.input, width: "140px" }}
                type="number"
                min="0"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={s.label}>Notes</label>
              <input
                style={{ ...s.input, width: "220px" }}
                placeholder="Optional notes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <button style={s.btnPrimary} type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </button>
          </form>
          {createError && <p style={{ color: "#dc2626", marginTop: "0.5rem" }}>{createError}</p>}
        </div>
      )}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {["License Key", "Domain", "Status", "Req Today", "Total Req", "Created", ""].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                  No licenses yet. Create one above.
                </td>
              </tr>
            )}
            {licenses.map((lic) => (
              <tr key={lic._id} style={s.tr}>
                <td style={s.td}>
                  <code style={{ fontSize: "0.8rem" }}>{lic.licenseKey}</code>
                </td>
                <td style={s.td}>{lic.domain}</td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: STATUS_COLORS[lic.status] + "22", color: STATUS_COLORS[lic.status] }}>
                    {lic.status}
                  </span>
                </td>
                <td style={s.td}>{lic.requestsToday}</td>
                <td style={s.td}>{lic.totalRequests}</td>
                <td style={s.td}>{lic.createdAt ? new Date(lic.createdAt).toLocaleDateString() : "—"}</td>
                <td style={s.td}>
                  <Link href={`/admin/licenses/${lic._id}`} style={{ color: "#2563eb" }}>
                    Details →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: { fontSize: "1.3rem", fontWeight: 700 },
  createBox: {
    background: "#fff",
    borderRadius: "8px",
    padding: "1.25rem",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  tableWrap: {
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflow: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 600,
    background: "#f9fafb",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "0.65rem 1rem", verticalAlign: "middle" },
  badge: {
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    fontWeight: 600,
    fontSize: "0.78rem",
  },
  label: { fontSize: "0.8rem", fontWeight: 500, color: "#555" },
  input: {
    padding: "0.45rem 0.7rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "0.9rem",
    width: "200px",
  },
  btnPrimary: {
    padding: "0.45rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 600,
  },
  btnSecondary: {
    padding: "0.45rem 1rem",
    background: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 500,
  },
};
