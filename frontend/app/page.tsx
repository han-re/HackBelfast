"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Party = {
  id: string;
  abbr: string;
  name: string;
  stance: string;
  seats: number;
  color: string;
  img: string;
  arcPos: { left: string; top: string };
};

const PARTIES: Party[] = [
  {
    id: "party_sinn_fein", abbr: "SF", name: "Sinn Féin",
    stance: "Irish republicanism · Left-wing", seats: 27, color: "#326760",
    img: "/images/1.png", arcPos: { left: "40.5%", top: "1.1%" },
  },
  {
    id: "party_dup", abbr: "DUP", name: "Democratic Unionist Party",
    stance: "Ulster unionism · Conservative", seats: 25, color: "#d4213d",
    img: "/images/2.png", arcPos: { left: "63%", top: "15%" },
  },
  {
    id: "party_alliance", abbr: "Alliance", name: "Alliance Party of NI",
    stance: "Non-sectarian · Liberal", seats: 17, color: "#f5c842",
    img: "/images/3.png", arcPos: { left: "68%", top: "39%" },
  },
  {
    id: "party_sdlp", abbr: "SDLP", name: "Social Democratic & Labour Party",
    stance: "Irish nationalism · Centre-left", seats: 12, color: "#2e9a41",
    img: "/images/4.png", arcPos: { left: "53%", top: "63%" },
  },
  {
    id: "party_uup", abbr: "UUP", name: "Ulster Unionist Party",
    stance: "Ulster unionism · Centre-right", seats: 9, color: "#48a5dd",
    img: "/images/5.png", arcPos: { left: "28%", top: "63%" },
  },
  {
    id: "party_tuv", abbr: "TUV", name: "Traditional Unionist Voice",
    stance: "Hard unionism · Eurosceptic", seats: 1, color: "#4a7ab5",
    img: "/images/6.png", arcPos: { left: "13%", top: "39%" },
  },
  {
    id: "party_pbp", abbr: "PBP", name: "People Before Profit",
    stance: "Socialist · Anti-sectarian", seats: 1, color: "#c0392b",
    img: "/images/7.png", arcPos: { left: "17%", top: "15%" },
  },
];

export default function Home() {
  const [scrollPct, setScrollPct] = useState(0);
  const [heroScale, setHeroScale] = useState(1);
  const [heroBlackOpacity, setHeroBlackOpacity] = useState(0);
  const [partiesVisible, setPartiesVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState<boolean[]>(Array(7).fill(false));
  const partiesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct((sy / docH) * 100);

      const vh = window.innerHeight;
      setHeroScale(1 + Math.min((sy / vh) * 0.08, 0.08));

      const fade = Math.max(0, Math.min(1, (sy - vh * 0.8) / (vh * 0.4)));
      setHeroBlackOpacity(fade);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = partiesRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPartiesVisible(true);
        PARTIES.forEach((_, i) =>
          setTimeout(
            () => setCardVisible(prev => { const n = [...prev]; n[i] = true; return n; }),
            i * 120,
          ),
        );
        obs.disconnect();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 h-0.5 z-[200] pointer-events-none"
        style={{
          width: `${scrollPct}%`,
          background: "linear-gradient(90deg, #e8962a, #b4cfe8, #e8962a)",
          backgroundSize: "200% 100%",
          animation: "shimmerBar 3s linear infinite",
        }}
      />

      {/* Fixed hero */}
      <div className="fixed top-0 left-0 w-full h-screen z-[100] overflow-hidden">
        {/* Background image with parallax scale */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/storm.jpg"
          alt="Stormont Parliament Buildings at night"
          className="w-full h-full object-cover object-center will-change-transform block"
          style={{ transform: `scale(${heroScale})`, transformOrigin: "center" }}
        />

        {/* Dark tint */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.62)" }} />

        {/* Scroll-fade to dark */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "#080e1a", opacity: heroBlackOpacity }}
        />

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none">
          {/* Mandate wordmark */}
          <div
            className="mb-4 tracking-widest uppercase"
            style={{
              fontSize: "0.72rem",
              color: "rgba(232,150,42,0.75)",
              letterSpacing: "0.22em",
              animation: "titleEntrance 1s ease 0.1s both",
            }}
          >
            Mandate
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 4.8vw, 4rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#b4cfe8",
              maxWidth: 780,
              lineHeight: 1.1,
              animation: "titleEntrance 1.2s cubic-bezier(0.16,1,0.3,1) 0.2s both",
              textShadow:
                "0 0 100px rgba(180,207,232,0.65), 0 0 40px rgba(180,207,232,0.35), 0 3px 0 rgba(0,0,0,1), 0 6px 20px rgba(0,0,0,1), 0 12px 40px rgba(0,0,0,0.85)",
            }}
          >
            Vote for who actually represents you, not who you&apos;ve always voted for.
          </h1>

          {/* Amber divider */}
          <div
            className="rounded"
            style={{
              width: 48,
              height: 2,
              margin: "1.4rem auto",
              background: "linear-gradient(90deg, transparent, #e8962a, transparent)",
              animation: "titleEntrance 1s ease 0.55s both",
            }}
          />

          <p
            style={{
              fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
              color: "rgba(215,228,242,0.85)",
              maxWidth: 520,
              lineHeight: 1.65,
              marginBottom: "2.2rem",
              animation: "titleEntrance 1s ease 0.7s both",
              textShadow: "0 2px 4px rgba(0,0,0,1), 0 4px 16px rgba(0,0,0,0.95)",
            }}
          >
            Find out which NI party your views actually align with, based on how they&apos;ve voted, not what they&apos;ve promised.
          </p>

          <Link
            href="/quiz"
            className="pointer-events-auto inline-flex items-center gap-2 font-extrabold"
            style={{
              background: "#e8962a",
              color: "#080e1a",
              fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)",
              padding: "0.9rem 2.6rem",
              borderRadius: 50,
              textDecoration: "none",
              boxShadow: "0 0 40px rgba(232,150,42,0.45), 0 8px 24px rgba(0,0,0,0.6)",
              animation: "titleEntrance 1s ease 1s both",
              letterSpacing: "0.01em",
              transition: "transform 0.18s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.03)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 60px rgba(232,150,42,0.6), 0 12px 32px rgba(0,0,0,0.7)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 40px rgba(232,150,42,0.45), 0 8px 24px rgba(0,0,0,0.6)";
            }}
          >
            Take the 90-second quiz
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 flex flex-col items-center gap-1 pointer-events-none"
          style={{
            transform: "translateX(-50%)",
            color: "rgba(180,207,232,0.5)",
            fontSize: "0.72rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            animation: "hintEntrance 1s ease 2s both, bounceTx 2.4s ease-in-out 3s infinite",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          Scroll
        </div>
      </div>

      {/* Spacer — pushes parties section below the fixed hero */}
      <div style={{ height: "150vh" }} />

      {/* Main scrollable content */}
      <main className="relative z-[1]">

        {/* Parties section */}
        <section
          ref={partiesRef}
          style={{
            position: "relative",
            overflow: "hidden",
            minHeight: "100vh",
            backgroundImage: "url('/images/storm.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "5rem",
            paddingBottom: "5rem",
            opacity: partiesVisible ? 1 : 0,
            transition: "opacity 1s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Dark overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "#080e1a", opacity: 0.88, zIndex: 0 }}
          />

          <div
            className="relative flex flex-col items-center w-full"
            style={{ zIndex: 1, maxWidth: 1400, gap: "0.5rem" }}
          >
            {/* Section header */}
            <div
              className="text-center mb-2"
              style={{
                opacity: partiesVisible ? 1 : 0,
                transition: "opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(1.4rem, 2.8vw, 2.2rem)",
                  fontWeight: 700,
                  color: "#b4cfe8",
                  marginBottom: "0.3rem",
                  textShadow: "0 0 40px rgba(180,207,232,0.25), 0 2px 8px rgba(0,0,0,0.9)",
                }}
              >
                The Seven Parties
              </h2>
              <p style={{ color: "rgba(180,207,232,0.38)", fontSize: "0.9rem" }}>
                Select a party to explore their record and MLAs
              </p>
            </div>

            {/* Party arc container */}
            <div style={{ position: "relative", width: "100%", height: 680 }}>
              {PARTIES.map((party, i) => (
                <Link
                  key={party.id}
                  href={`/party/${party.id}`}
                  style={{
                    position: "absolute",
                    left: party.arcPos.left,
                    top: party.arcPos.top,
                    width: "20%",
                    aspectRatio: "2 / 1",
                    backgroundImage: `linear-gradient(rgba(8,14,26,0.74), rgba(8,14,26,0.74)), url('${party.img}')`,
                    backgroundColor: "rgba(11,20,38,0.82)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "1px solid rgba(180,207,232,0.11)",
                    borderRadius: 14,
                    padding: "0.8rem 0.9rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                    cursor: "pointer",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    overflow: "hidden",
                    textDecoration: "none",
                    boxShadow: "inset 0 1px 0 rgba(180,207,232,0.07)",
                    opacity: cardVisible[i] ? 1 : 0,
                    transform: cardVisible[i] ? "translateY(0)" : "translateY(22px)",
                    transition:
                      "opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = party.color;
                    el.style.boxShadow = `0 0 0 1px ${party.color}, 0 0 28px -4px ${party.color}, 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(180,207,232,0.10)`;
                    el.style.transform = "translateY(-3px) scale(1.02)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(180,207,232,0.11)";
                    el.style.boxShadow = "inset 0 1px 0 rgba(180,207,232,0.07)";
                    el.style.transform = "translateY(0) scale(1)";
                  }}
                >
                  {/* Colour top stripe */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0, left: 0, right: 0,
                      height: 3,
                      background: party.color,
                      borderRadius: "14px 14px 0 0",
                      opacity: 0.85,
                    }}
                  />

                  <div
                    style={{
                      fontSize: "clamp(0.9rem, 1.6vw, 1.3rem)",
                      fontWeight: 900,
                      color: "#fff",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {party.abbr}
                  </div>

                  <div style={{ fontSize: "clamp(0.6rem, 1vw, 0.78rem)", color: "#fff", lineHeight: 1.25 }}>
                    {party.name}
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(0.55rem, 0.85vw, 0.68rem)",
                      color: "rgba(255,255,255,0.75)",
                      borderTop: "1px solid rgba(255,255,255,0.15)",
                      paddingTop: "0.3rem",
                      marginTop: "0.1rem",
                    }}
                  >
                    {party.stance}
                  </div>

                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "clamp(0.5rem, 0.75vw, 0.62rem)",
                      fontWeight: 600,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 20,
                      padding: "0.12rem 0.5rem",
                      color: "#fff",
                      marginTop: "auto",
                      alignSelf: "flex-start",
                    }}
                  >
                    {party.seats} {party.seats === 1 ? "seat" : "seats"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            background: "#080e1a",
            borderTop: "1px solid rgba(180,207,232,0.08)",
            padding: "3.5rem 2rem 3rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h3
              style={{
                color: "#b4cfe8",
                fontSize: "0.88rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              Methodology
            </h3>
            <p style={{ color: "rgba(180,207,232,0.45)", fontSize: "0.78rem", lineHeight: 1.75, marginBottom: "1.4rem" }}>
              Alignment scores are calculated from verified voting records in the Northern Ireland Assembly.
              Each policy axis is scored -2 to +2. Your quiz responses are compared against each
              party&apos;s actual votes, not their manifesto rhetoric. The scoring formula and all party data
              are stamped on the Solana blockchain so the analysis cannot be silently altered.
            </p>
            <a
              href="https://explorer.solana.com/?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
              style={{
                color: "#60a5fa",
                fontSize: "0.76rem",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#93c5fd")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#60a5fa")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              View methodology hash on Solana Explorer (devnet)
            </a>
            <div
              style={{
                marginTop: "2.5rem",
                color: "rgba(180,207,232,0.18)",
                fontSize: "0.72rem",
              }}
            >
              © 2026 Mandate · HackBelfast 2026
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
