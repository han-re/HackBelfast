"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useProPage } from "./ProPageContext";

interface ProHealth {
  last_donations_seeded_at: string | null;
  last_spending_seeded_at: string | null;
  last_sessions_seeded_at: string | null;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const ts = Date.parse(iso);
  if (isNaN(ts)) return "never";
  const ageMs = Date.now() - ts;
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function ProTopBar() {
  const { meta } = useProPage();
  const [freshness, setFreshness] = useState<string>("");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/pro/health`)
      .then((r) => (r.ok ? r.json() : null))
      .then((h: ProHealth | null) => {
        if (!h) return;
        // Use the most recently-touched of the three seeds as the headline
        // freshness — a journalist cares whether the page they're looking
        // at is fresh, and all three feed the same surface.
        const stamps = [
          h.last_donations_seeded_at,
          h.last_spending_seeded_at,
          h.last_sessions_seeded_at,
        ].filter((s): s is string => Boolean(s));
        if (stamps.length === 0) {
          setFreshness("never");
          return;
        }
        const newest = stamps.sort().reverse()[0];
        setFreshness(formatRelative(newest));
      })
      .catch(() => setFreshness("unknown"));
  }, []);

  const barStyle: CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "var(--vw-pro-surface)",
    borderBottom: "1px solid var(--vw-pro-grid)",
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    gap: 18,
    backdropFilter: "blur(6px)",
  };

  const breadcrumbStyle: CSSProperties = {
    color: "rgba(180,207,232,0.45)",
    fontSize: 12,
    letterSpacing: "0.02em",
  };

  return (
    <header style={barStyle}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {meta.breadcrumb.length > 0 && (
          <div style={breadcrumbStyle}>{meta.breadcrumb.join(" / ")}</div>
        )}
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#e6eef7",
          }}
        >
          {meta.title}
        </h1>
      </div>

      <div
        style={{
          fontSize: 11.5,
          color: "rgba(180,207,232,0.55)",
          fontFamily: "var(--vw-pro-mono)",
          whiteSpace: "nowrap",
        }}
      >
        Data updated {freshness}
      </div>

      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          padding: "3px 8px",
          borderRadius: 4,
          background: "var(--vw-pro-cyan-dim)",
          color: "var(--vw-pro-cyan)",
          fontFamily: "var(--vw-pro-mono)",
        }}
      >
        PRO
      </span>
    </header>
  );
}
