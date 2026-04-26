"use client";
import { useEffect, useState } from "react";

interface ChainState {
  tx_signature: string;
  profile_hash: string;
  explorer_url: string;
  verified_at: string;
  fallback: boolean;
}

interface Props {
  politicianId: string;
}

export default function VerifiedBadge({ politicianId }: Props) {
  const [state, setState] = useState<ChainState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${api}/politician/${politicianId}/chain`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setState(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [politicianId]);

  if (loading) return null;
  if (!state) return null;

  const date = new Date(state.verified_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <a
      href={state.explorer_url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Profile hash: ${state.profile_hash}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Blockchain Verified · {date}
    </a>
  );
}
