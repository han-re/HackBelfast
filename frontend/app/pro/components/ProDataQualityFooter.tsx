"use client";

import type { CSSProperties } from "react";
import { useProPage } from "./ProPageContext";
import { formatRelative, newestSeedStamp } from "./freshness";

export function ProDataQualityFooter() {
  const { health } = useProPage();
  const updated = formatRelative(newestSeedStamp(health));

  const style: CSSProperties = {
    borderTop: "1px solid var(--vw-pro-grid)",
    padding: "12px 32px",
    fontSize: 11.5,
    color: "rgba(180,207,232,0.5)",
    lineHeight: 1.55,
    background: "var(--vw-pro-surface)",
  };

  return (
    <footer style={style}>
      Donations: Electoral Commission (2010–present). Sessions: NI Assembly Hansard
      (curated subset). Some engagement metrics are illustrative for demonstration.
      Last updated: {updated}.
    </footer>
  );
}
