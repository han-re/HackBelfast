"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ChainPanel from "../../components/ChainPanel";
import VerifiedBadge from "../../components/VerifiedBadge";

type Vote = {
  bill: string;
  date: string;
  vote: "For" | "Against" | "Abstain";
  policy_axis: string;
  stance_value: number;
  hansard_url: string;
};

type Interest = {
  type: string;
  entity: string;
  registered_date: string;
  value: string;
  synthetic?: boolean;
};

type Donation = {
  donor: string;
  amount: number;
  date: string;
  type: string;
  synthetic?: boolean;
};

type Mla = {
  _id: string;
  name: string;
  party_id: string;
  constituency: string;
  role?: string;
  photo_url: string;
  bio_short: string;
  party_line_voting_pct: number;
  votes: Vote[];
  declared_interests: Interest[];
  donations: Donation[];
};

type Tab = "overview" | "votes" | "interests" | "verification";

const PARTY_COLORS: Record<string, string> = {
  party_sinn_fein: "#326760",
  party_dup:       "#d4213d",
  party_alliance:  "#f5c842",
  party_sdlp:      "#2e9a41",
  party_uup:       "#48a5dd",
  party_tuv:       "#4a7ab5",
  party_pbp:       "#c0392b",
};

const PARTY_NAMES: Record<string, string> = {
  party_sinn_fein: "Sinn Féin",
  party_dup:       "Democratic Unionist Party",
  party_alliance:  "Alliance Party",
  party_sdlp:      "SDLP",
  party_uup:       "Ulster Unionist Party",
  party_tuv:       "Traditional Unionist Voice",
  party_pbp:       "People Before Profit",
};

// quiz question id -> policy axis
const QUESTION_AXIS: Record<string, string> = {
  q1: "housing", q2: "education", q3: "language",
  q4: "environment", q5: "health", q6: "equality",
  q7: "economy", q8: "welfare", q9: "integration", q10: "justice",
};

const VOTE_COLORS = {
  For:     { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#22c55e" },
  Against: { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",  text: "#ef4444" },
  Abstain: { bg: "rgba(180,207,232,0.05)", border: "rgba(180,207,232,0.15)", text: "rgba(180,207,232,0.5)" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

// Returns {axis: user_answer} from sessionStorage quiz answers
function loadQuizAnswers(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem("mandate_answers");
    if (!raw) return {};
    const answers: Record<string, number> = JSON.parse(raw);
    const byAxis: Record<string, number> = {};
    for (const [qid, val] of Object.entries(answers)) {
      const axis = QUESTION_AXIS[qid];
      if (axis) byAxis[axis] = val;
    }
    return byAxis;
  } catch {
    return {};
  }
}

// Returns pre-computed alignment pct for this MLA from sessionStorage results
function loadStoredAlignment(mlaId: string): number | null {
  try {
    const raw = sessionStorage.getItem("mandate_results");
    if (!raw) return null;
    const results = JSON.parse(raw);
    const match = (results.mla_alignment ?? []).find(
      (m: { mla_id: string; alignment_pct: number }) => m.mla_id === mlaId,
    );
    return match?.alignment_pct ?? null;
  } catch {
    return null;
  }
}

// Compute top 3 votes most aligned with user (smallest axis distance)
function topAlignedVotes(votes: Vote[], userAnswers: Record<string, number>): Vote[] {
  if (Object.keys(userAnswers).length === 0) return votes.slice(0, 3);
  return [...votes]
    .map(v => ({ vote: v, dist: Math.abs((userAnswers[v.policy_axis] ?? 0) - v.stance_value) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    .map(x => x.vote);
}

export default function MlaPage() {
  const params = useParams();
  const id = params.id as string;

  const [mla, setMla] = useState<Mla | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [alignment, setAlignment] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/mla/${id}`)
      .then(r => { if (!r.ok) throw new Error("MLA not found"); return r.json(); })
      .then(data => { setMla(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });

    // Load alignment + answers from sessionStorage (set after quiz)
    setAlignment(loadStoredAlignment(id));
    setUserAnswers(loadQuizAnswers());
  }, [id]);

  const color = mla ? (PARTY_COLORS[mla.party_id] ?? "#b4cfe8") : "#b4cfe8";
  const partyName = mla ? (PARTY_NAMES[mla.party_id] ?? mla.party_id) : "";

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview",      label: "Overview" },
    { id: "votes",         label: "Voting Record" },
    { id: "interests",     label: "Interests" },
    { id: "verification",  label: "Verification" },
  ];

  if (loading) {
    return (
      <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(180,207,232,0.4)", fontSize: "0.9rem" }}>Loading MLA profile...</div>
      </div>
    );
  }

  if (error || !mla) {
    return (
      <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div style={{ color: "#ef4444", fontSize: "0.9rem" }}>MLA not found</div>
        <Link href="/" style={{ color: "#60a5fa", fontSize: "0.8rem" }}>← Back to Mandate</Link>
      </div>
    );
  }

  const initials = mla.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const top3Votes = topAlignedVotes(mla.votes ?? [], userAnswers);

  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", color: "#cddcec" }}>

      {/* Nav */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(8,14,26,0.92)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(180,207,232,0.08)",
          padding: "0.75rem 2rem",
          display: "flex", alignItems: "center", gap: "1rem",
        }}
      >
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "rgba(180,207,232,0.55)", fontSize: "0.8rem", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#b4cfe8")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(180,207,232,0.55)")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Mandate
        </Link>
        <span style={{ color: "rgba(180,207,232,0.2)", fontSize: "0.8rem" }}>/</span>
        <Link
          href={`/party/${mla.party_id}`}
          style={{ color: color, fontSize: "0.8rem", textDecoration: "none", fontWeight: 600 }}
        >
          {PARTY_NAMES[mla.party_id] ?? mla.party_id}
        </Link>
        <span style={{ color: "rgba(180,207,232,0.2)", fontSize: "0.8rem" }}>/</span>
        <span style={{ color: "#b4cfe8", fontSize: "0.8rem" }}>{mla.name}</span>
      </div>

      {/* Party colour accent bar */}
      <div style={{ height: 4, background: color }} />

      {/* Header */}
      <header style={{ padding: "2.5rem 2rem 1.5rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap" }}>

          {/* Avatar + identity */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.4rem" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {!imgError && mla.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mla.photo_url}
                  alt={mla.name}
                  onError={() => setImgError(true)}
                  style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${color}50` }}
                />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
                  background: `${color}18`, border: `3px solid ${color}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem", fontWeight: 900, color,
                }}>
                  {initials}
                </div>
              )}
            </div>

            <div>
              <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 900, color: "#b4cfe8", marginBottom: "0.3rem", lineHeight: 1.1 }}>
                {mla.name}
              </h1>
              {mla.role && (
                <div style={{ fontSize: "0.82rem", color, fontWeight: 600, marginBottom: "0.25rem" }}>
                  {mla.role}
                </div>
              )}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link
                  href={`/party/${mla.party_id}`}
                  style={{
                    fontSize: "0.76rem", color: "rgba(180,207,232,0.55)",
                    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                  {partyName}
                </Link>
                <span style={{ fontSize: "0.76rem", color: "rgba(180,207,232,0.4)" }}>
                  {mla.constituency}
                </span>
              </div>
            </div>
          </div>

          {/* Right: badge + alignment */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem" }}>
            <VerifiedBadge politicianId={mla._id} />

            {alignment !== null && (
              <div
                style={{
                  background: `${color}15`,
                  border: `1px solid ${color}40`,
                  borderRadius: 10,
                  padding: "0.6rem 1rem",
                  textAlign: "right",
                }}
              >
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color, lineHeight: 1 }}>
                  {alignment}%
                </div>
                <div style={{ fontSize: "0.65rem", color: "rgba(180,207,232,0.45)", marginTop: "0.15rem" }}>
                  your alignment
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div
        style={{
          borderBottom: "1px solid rgba(180,207,232,0.08)",
          padding: "0 2rem",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", gap: "0" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: tab === t.id ? `2px solid ${color}` : "2px solid transparent",
                color: tab === t.id ? "#b4cfe8" : "rgba(180,207,232,0.35)",
                fontSize: "0.82rem",
                fontWeight: tab === t.id ? 700 : 400,
                padding: "0.75rem 1.1rem",
                cursor: "pointer",
                transition: "color 0.2s",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 2rem 4rem" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Bio */}
            {mla.bio_short && (
              <div
                style={{
                  background: "rgba(11,20,38,0.7)",
                  border: "1px solid rgba(180,207,232,0.1)",
                  borderLeft: `3px solid ${color}60`,
                  borderRadius: "0 10px 10px 0",
                  padding: "1.1rem 1.2rem",
                }}
              >
                <p style={{ fontSize: "0.9rem", color: "rgba(215,228,242,0.8)", lineHeight: 1.7, margin: 0 }}>
                  {mla.bio_short}
                </p>
              </div>
            )}

            {/* Party-line stat */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div
                style={{
                  flex: "1 1 180px",
                  background: "rgba(11,20,38,0.7)",
                  border: "1px solid rgba(180,207,232,0.1)",
                  borderRadius: 12,
                  padding: "1.2rem 1.4rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 900, color, lineHeight: 1 }}>
                  {mla.party_line_voting_pct}%
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgba(180,207,232,0.4)", marginTop: "0.4rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Party-line voting
                </div>
              </div>
              <div
                style={{
                  flex: "1 1 180px",
                  background: "rgba(11,20,38,0.7)",
                  border: "1px solid rgba(180,207,232,0.1)",
                  borderRadius: 12,
                  padding: "1.2rem 1.4rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 900, color: "#b4cfe8", lineHeight: 1 }}>
                  {(mla.votes ?? []).length}
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgba(180,207,232,0.4)", marginTop: "0.4rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Tracked votes
                </div>
              </div>
            </div>

            {/* Top 3 votes */}
            {(mla.votes ?? []).length > 0 && (
              <div>
                <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(180,207,232,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.9rem" }}>
                  {Object.keys(userAnswers).length > 0 ? "Top votes aligned with you" : "Notable votes"}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {top3Votes.map((v, i) => {
                    const vc = VOTE_COLORS[v.vote] ?? VOTE_COLORS.Abstain;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.85rem",
                          padding: "0.85rem 1rem",
                          background: vc.bg, border: `1px solid ${vc.border}`, borderRadius: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em",
                            textTransform: "uppercase", color: vc.text,
                            minWidth: 56, textAlign: "center",
                            background: `${vc.border}`, border: `1px solid ${vc.border}`,
                            borderRadius: 20, padding: "0.15rem 0.5rem",
                          }}
                        >
                          {v.vote}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.83rem", color: "rgba(215,228,242,0.85)", fontWeight: 600 }}>
                            {v.bill}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "rgba(180,207,232,0.4)", marginTop: "0.15rem" }}>
                            {fmtDate(v.date)} · {v.policy_axis}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VOTING RECORD ── */}
        {tab === "votes" && (
          <div>
            <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(180,207,232,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              All recorded votes ({(mla.votes ?? []).length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(mla.votes ?? []).map((v, i) => {
                const vc = VOTE_COLORS[v.vote] ?? VOTE_COLORS.Abstain;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "0.85rem",
                      padding: "0.9rem 1rem",
                      background: vc.bg, border: `1px solid ${vc.border}`, borderRadius: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.05em",
                        textTransform: "uppercase", color: vc.text,
                        minWidth: 52, textAlign: "center",
                        border: `1px solid ${vc.border}`,
                        borderRadius: 20, padding: "0.15rem 0.45rem",
                        flexShrink: 0, marginTop: "0.1rem",
                      }}
                    >
                      {v.vote}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", color: "rgba(215,228,242,0.85)", fontWeight: 600, marginBottom: "0.2rem" }}>
                        {v.bill}
                      </div>
                      <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.7rem", color: "rgba(180,207,232,0.4)" }}>{fmtDate(v.date)}</span>
                        <span
                          style={{
                            fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            background: "rgba(232,150,42,0.1)", color: "#e8962a",
                            border: "1px solid rgba(232,150,42,0.22)", borderRadius: 20,
                            padding: "0.05rem 0.4rem",
                          }}
                        >
                          {v.policy_axis}
                        </span>
                      </div>
                    </div>
                    {v.hansard_url && (
                      <a
                        href={v.hansard_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.25rem",
                          fontSize: "0.68rem", color: "#60a5fa", textDecoration: "none",
                          flexShrink: 0, marginTop: "0.1rem",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#93c5fd")}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#60a5fa")}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                        Hansard
                      </a>
                    )}
                  </div>
                );
              })}
              {(mla.votes ?? []).length === 0 && (
                <p style={{ color: "rgba(180,207,232,0.35)", fontSize: "0.85rem" }}>No votes recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* ── INTERESTS ── */}
        {tab === "interests" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* Declared interests */}
            <div>
              <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(180,207,232,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.9rem" }}>
                Declared Interests
              </h3>
              {(mla.declared_interests ?? []).length > 0 ? (
                <div style={{ background: "rgba(11,20,38,0.7)", border: "1px solid rgba(180,207,232,0.1)", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(180,207,232,0.08)" }}>
                        {["Type", "Entity", "Registered", "Value"].map(h => (
                          <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "rgba(180,207,232,0.35)", fontWeight: 600, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(mla.declared_interests ?? []).map((item, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: i < (mla.declared_interests?.length ?? 0) - 1 ? "1px solid rgba(180,207,232,0.05)" : "none",
                          }}
                        >
                          <td style={{ padding: "0.75rem 1rem", color: "rgba(215,228,242,0.7)" }}>{item.type}</td>
                          <td style={{ padding: "0.75rem 1rem", color: "rgba(215,228,242,0.85)", fontWeight: 600 }}>{item.entity}</td>
                          <td style={{ padding: "0.75rem 1rem", color: "rgba(180,207,232,0.45)" }}>{fmtDate(item.registered_date)}</td>
                          <td style={{ padding: "0.75rem 1rem", color: "rgba(215,228,242,0.6)" }}>{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "rgba(180,207,232,0.35)", fontSize: "0.85rem" }}>No declared interests registered.</p>
              )}
            </div>

            {/* Donations */}
            <div>
              <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(180,207,232,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.9rem" }}>
                Reported Donations
              </h3>
              {(mla.donations ?? []).length > 0 ? (
                <div style={{ background: "rgba(11,20,38,0.7)", border: "1px solid rgba(180,207,232,0.1)", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(180,207,232,0.08)" }}>
                        {["Donor", "Amount", "Date", "Type"].map(h => (
                          <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "rgba(180,207,232,0.35)", fontWeight: 600, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(mla.donations ?? []).map((d, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: i < (mla.donations?.length ?? 0) - 1 ? "1px solid rgba(180,207,232,0.05)" : "none" }}
                        >
                          <td style={{ padding: "0.75rem 1rem", color: "rgba(215,228,242,0.85)", fontWeight: 600 }}>{d.donor}</td>
                          <td style={{ padding: "0.75rem 1rem", color: "#22c55e", fontWeight: 700 }}>{fmtGBP(d.amount)}</td>
                          <td style={{ padding: "0.75rem 1rem", color: "rgba(180,207,232,0.45)" }}>{fmtDate(d.date)}</td>
                          <td style={{ padding: "0.75rem 1rem", color: "rgba(180,207,232,0.5)" }}>{d.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "rgba(180,207,232,0.35)", fontSize: "0.85rem" }}>No donations on record.</p>
              )}
            </div>

            <p style={{ fontSize: "0.68rem", color: "rgba(180,207,232,0.2)", fontStyle: "italic" }}>
              Interests and donations data sourced from the NI Assembly Register of Members&apos; Interests and Electoral Commission records. Some entries are illustrative for demonstration purposes.
            </p>
          </div>
        )}

        {/* ── VERIFICATION ── */}
        {tab === "verification" && (
          <div>
            <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(180,207,232,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.2rem" }}>
              Blockchain Verification
            </h3>
            <ChainPanel politicianId={mla._id} />
          </div>
        )}

      </div>
    </div>
  );
}
