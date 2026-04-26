"use client";
import VerifiedBadge from "../components/VerifiedBadge";
import ChainPanel from "../components/ChainPanel";

const DEMO_ID = "pol_001";

export default function ChainDemo() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

      {/* Simulates what the overview tab header looks like */}
      <div className="border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Margaret Collins</h1>
            <p className="text-sm text-gray-500 mt-0.5">MP · Belfast North · Progressive Party</p>
          </div>
          {/* DROP THIS ANYWHERE ON THE PROFILE PAGE */}
          <VerifiedBadge politicianId={DEMO_ID} />
        </div>
      </div>

      {/* Simulates the Chain tab content */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Chain tab content
        </h2>
        {/* DROP THIS AS THE CHAIN TAB BODY */}
        <ChainPanel politicianId={DEMO_ID} />
      </div>

    </div>
  );
}
