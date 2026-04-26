"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type PromiseItem = {
  id: string;
  title: string;
  category: string;
  status: "kept" | "in_progress" | "broken";
  evidence: string;
  source_url: string;
};

type Party = {
  _id: string;
  name: string;
  short_name: string;
  leader: string;
  seats_2022: number;
  ideology: string;
  primary_color: string;
  manifesto_summary: string;
  promises: PromiseItem[];
  scorecard_summary: { kept: number; in_progress: number; broken: number };
};

type Mla = {
  _id: string;
  name: string;
  constituency: string;
  role?: string;
  bio_short: string;
  party_line_voting_pct: number;
};

const STATUS_META = {
  kept:        { label: "Kept",        dot: "#22c55e", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.2)",   text: "#22c55e" },
  in_progress: { label: "In Progress", dot: "#eab308", bg: "rgba(234,179,8,0.07)",   border: "rgba(234,179,8,0.2)",   text: "#eab308" },
  broken:      { label: "Broken",      dot: "#ef4444", bg: "rgba(239,68,68,0.07)",    border: "rgba(239,68,68,0.2)",   text: "#ef4444" },
};

function PromiseRow({ promise }: { promise: PromiseItem }) {
  const meta = STATUS_META[promise.status];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.85rem 1rem",
        borderRadius: 10,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        marginBottom: "0.5rem",
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: 9, height: 9,
          borderRadius: "50%",
          background: meta.dot,
          boxShadow: `0 0 6px ${meta.dot}80`,
          flexShrink: 0,
          marginTop: "0.35rem",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(215,228,242,0.9)" }}>
            {promise.title}
          </span>
          <span
            style={{
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "rgba(232,150,42,0.12)", color: "#e8962a",
              border: "1px solid rgba(232,150,42,0.25)", borderRadius: 20,
              padding: "0.1rem 0.45rem",
            }}
          >
            {promise.category}
          </span>
        </div>
        <p style={{ fontSize: "0.76rem", color: "rgba(180,207,232,0.6)", lineHeight: 1.5, margin: 0 }}>
          {promise.evidence}
        </p>
        {promise.source_url && !promise.source_url.includes("placeholder") && (
          <a
            href={promise.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
              fontSize: "0.68rem", color: "#60a5fa", textDecoration: "none",
              marginTop: "0.3rem",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            Source
          </a>
        )}
      </div>
      <span
        style={{
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em",
          textTransform: "uppercase", color: meta.text,
          flexShrink: 0, alignSelf: "flex-start",
          marginTop: "0.2rem",
        }}
      >
        {meta.label}
      </span>
    </div>
  );
}

function PromiseGroup({ status, promises }: { status: "kept" | "in_progress" | "broken"; promises: PromiseItem[] }) {
  if (promises.length === 0) return null;
  const meta = STATUS_META[status];
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: meta.dot, boxShadow: `0 0 8px ${meta.dot}` }} />
        <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: meta.text, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          {meta.label} ({promises.length})
        </h3>
      </div>
      {promises.map(p => <PromiseRow key={p.id} promise={p} />)}
    </div>
  );
}

function MlaCard({ mla, partyColor }: { mla: Mla; partyColor: string }) {
  const initials = mla.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Link
      href={`/mla/${mla._id}`}
      style={{
        flex: "1 1 260px",
        maxWidth: 340,
        background: "rgba(11,20,38,0.82)",
        border: "1px solid rgba(180,207,232,0.11)",
        borderRadius: 14,
        padding: "1.3rem 1.2rem",
        textDecoration: "none",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease",
        cursor: "pointer",
        display: "block",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = partyColor;
        el.style.boxShadow = `0 0 0 1px ${partyColor}, 0 0 24px -4px ${partyColor}, 0 12px 32px rgba(0,0,0,0.5)`;
        el.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(180,207,232,0.11)";
        el.style.boxShadow = "";
        el.style.transform = "";
      }}
    >
      {/* Colour stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: partyColor, borderRadius: "14px 14px 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        {/* Avatar */}
        <div
          style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: "rgba(180,207,232,0.07)",
            border: `2px solid ${partyColor}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", fontWeight: 700, color: partyColor,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "rgba(215,228,242,0.9)", marginBottom: "0.2rem" }}>
            {mla.name}
          </div>
          {mla.role && (
            <div style={{ fontSize: "0.72rem", color: partyColor, fontWeight: 600, marginBottom: "0.2rem" }}>
              {mla.role}
            </div>
          )}
          <div style={{ fontSize: "0.72rem", color: "rgba(180,207,232,0.45)" }}>
            {mla.constituency}
          </div>
        </div>
      </div>

      {mla.bio_short && (
        <p style={{
          fontSize: "0.74rem", color: "rgba(180,207,232,0.55)", lineHeight: 1.55,
          marginTop: "0.85rem", marginBottom: 0,
        }}>
          {mla.bio_short}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.9rem" }}>
        <span style={{ fontSize: "0.65rem", color: "rgba(180,207,232,0.35)" }}>
          Party-line votes: {mla.party_line_voting_pct}%
        </span>
        <span style={{ fontSize: "0.68rem", color: "#b4cfe8", opacity: 0.5 }}>View profile →</span>
      </div>
    </Link>
  );
}

export default function PartyPage() {
  const params = useParams();
  const id = params.id as string;
  const [party, setParty] = useState<Party | null>(null);
  const [mlas, setMlas] = useState<Mla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    Promise.all([
      fetch(`${apiUrl}/party/${id}`).then(r => {
        if (!r.ok) throw new Error("Party not found");
        return r.json();
      }),
      fetch(`${apiUrl}/party/${id}/mlas`).then(r => r.json()),
    ])
      .then(([partyData, mlasData]) => {
        setParty(partyData);
        setMlas(Array.isArray(mlasData) ? mlasData : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(180,207,232,0.4)", fontSize: "0.9rem" }}>Loading party data...</div>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div style={{ color: "#ef4444", fontSize: "0.9rem" }}>Party not found</div>
        <Link href="/" style={{ color: "#60a5fa", fontSize: "0.8rem" }}>← Back to Mandate</Link>
      </div>
    );
  }

  const color = party.primary_color;
  const { kept, in_progress, broken } = party.scorecard_summary;
  const total = kept + in_progress + broken;

  const keptPromises    = party.promises.filter(p => p.status === "kept");
  const progressPromises = party.promises.filter(p => p.status === "in_progress");
  const brokenPromises  = party.promises.filter(p => p.status === "broken");

  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", color: "#cddcec" }}>

      {/* Top nav */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(8,14,26,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(180,207,232,0.08)",
          padding: "0.75rem 2rem",
          display: "flex", alignItems: "center", gap: "1rem",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            color: "rgba(180,207,232,0.55)", fontSize: "0.8rem", textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#b4cfe8")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(180,207,232,0.55)")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Mandate
        </Link>
        <span style={{ color: "rgba(180,207,232,0.2)", fontSize: "0.8rem" }}>/</span>
        <span style={{ color: "#b4cfe8", fontSize: "0.8rem", fontWeight: 600 }}>{party.short_name}</span>
      </div>

      {/* Party header */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        {/* Colour accent bar */}
        <div style={{ height: 4, background: color }} />

        <div
          style={{
            padding: "3rem 2rem 2.5rem",
            maxWidth: 900,
            margin: "0 auto",
            position: "relative",
          }}
        >
          {/* Subtle glow behind header */}
          <div
            style={{
              position: "absolute", top: "50%", left: "10%",
              width: 400, height: 400,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }}>
              {/* Party colour badge */}
              <div
                style={{
                  width: 64, height: 64, borderRadius: 14, flexShrink: 0,
                  background: `${color}20`,
                  border: `2px solid ${color}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem", fontWeight: 900, color,
                  letterSpacing: "-0.02em",
                }}
              >
                {party.short_name.slice(0, 3)}
              </div>

              <div>
                <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, color: "#b4cfe8", marginBottom: "0.3rem", lineHeight: 1.1 }}>
                  {party.name}
                </h1>
                <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "rgba(180,207,232,0.55)" }}>
                    <span style={{ color: "rgba(180,207,232,0.35)" }}>Leader</span> {party.leader}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "rgba(180,207,232,0.55)" }}>
                    <span style={{ color: "rgba(180,207,232,0.35)" }}>Seats 2022</span> {party.seats_2022}
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: color, fontWeight: 600, margin: 0 }}>
                  {party.ideology}
                </p>
              </div>
            </div>

            {party.manifesto_summary && (
              <p style={{
                marginTop: "1.4rem",
                fontSize: "0.82rem", color: "rgba(180,207,232,0.5)", lineHeight: 1.7,
                maxWidth: 700,
                borderLeft: `3px solid ${color}40`,
                paddingLeft: "1rem",
              }}>
                {party.manifesto_summary}
              </p>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 4rem" }}>

        {/* Scorecard summary — three big numbers */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(180,207,232,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            2022 Manifesto Scorecard
          </h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[
              { count: kept,        label: "Kept",        color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)" },
              { count: in_progress, label: "In Progress", color: "#eab308", bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.2)" },
              { count: broken,      label: "Broken",      color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)" },
            ].map(({ count, label, color: c, bg, border }) => (
              <div
                key={label}
                style={{
                  flex: "1 1 140px",
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 14,
                  padding: "1.4rem 1.6rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 900, color: c, lineHeight: 1 }}>
                  {count}
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.4rem", opacity: 0.8 }}>
                  {label}
                </div>
                <div style={{ fontSize: "0.66rem", color: "rgba(180,207,232,0.3)", marginTop: "0.25rem" }}>
                  of {total} pledges
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Promises list */}
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(180,207,232,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.2rem" }}>
            Promise Tracker
          </h2>
          <PromiseGroup status="kept"        promises={keptPromises} />
          <PromiseGroup status="in_progress" promises={progressPromises} />
          <PromiseGroup status="broken"      promises={brokenPromises} />
        </section>

        {/* MLAs section */}
        {mlas.length > 0 && (
          <section>
            <h2 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(180,207,232,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              MLAs
            </h2>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {mlas.filter(m => !("placeholder" in m && (m as Mla & { placeholder?: boolean }).placeholder)).map(mla => (
                <MlaCard key={mla._id} mla={mla} partyColor={color} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
