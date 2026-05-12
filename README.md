# VoteWise

**Vote for the policy, not the tribe.**

Northern Ireland has 90 MLAs making decisions on housing, health, and education — but most people vote on identity, not policy. VoteWise breaks that pattern. Take a 90-second quiz, get a data-driven alignment score against every party's actual Assembly voting record (not their manifesto rhetoric), and find out who really represents you — then dig into party scorecards, MLA profiles, donations, and a tamper-evident data trail anchored on Solana.

🏆 **Winner — Best Startup Potential** (Twin Path Ventures) · 🏆 **Winner — Best Solana Use-Case** (Superteam Ireland)

---

## Live

| | URL |
|---|---|
| Site | https://votewise.xyz |
| Frontend (Vercel) | https://hack-belfast.vercel.app |
| Backend API (Railway) | https://hackbelfast-production.up.railway.app |

No login required. From the homepage, hit **Take the 90-second quiz** → answer 10 questions → land on your results (audio plays automatically). Click a party for its scorecard, an MLA for their profile. On any MLA profile open the **Verification** tab and press **Verify Now** to re-hash the record in your browser and check it against Solana. The B2B analytics product lives at `/pro`.

---

## What's in it

### Voter product (free)

- **Policy quiz** — 10 questions across housing, education, language, climate, health, equality, economy, welfare, all-island integration, and legacy. Five-point Likert scale, one question per screen, auto-advances on selection, completes in under 90 seconds.
- **Alignment engine** — scores your answers against each party's *revealed voting record*, not their manifesto. Ranks all 7 NI parties and surfaces your top 6 MLA matches, each scored on that MLA's own votes.
- **Results page** — top-match hero with your alignment percentage, a bar chart across all 7 parties, a "you might be surprised" callout when your match diverges from your likely tribal default, and an auto-playing 90-second personalised audio briefing.
- **Party scorecards** — per-party promise tracker for all 7 parties: every 2022 commitment marked kept, in progress, or broken, with a one-line evidence note and a source link, plus that party's MLAs.
- **MLA profiles** — tabbed: Overview (bio, party-line voting %, top votes vs your answers), Voting Record (full list, each linked to Hansard), Interests (declared interests and donations tables), and Verification (on-chain proof panel).
- **Blockchain verification** — every MLA profile is SHA-256 fingerprinted and stamped on Solana via the SPL Memo program. **Verify Now** recomputes the hash client-side with the Web Crypto API and diffs it against the on-chain record; any silent edit to the database becomes publicly detectable.

### VoteWise Pro (B2B analytics)

A separate analytics tier at `/pro` for newsrooms and political-research organisations who need the underlying dataset in filterable, drill-down form rather than the voter summary.

- **Overview dashboard** — KPI tiles, donations-by-party time series, attendance and engagement leaderboards, recent sessions.
- **Donations & spending tracker** — UK Electoral Commission data filterable by date range, party, and donor type; stacked time series; expandable per-donor breakdowns; campaign spending by category.
- **Attendance & engagement leaderboard** — per-MLA attendance percentage and an engagement score derived from speeches, division votes, and written questions, with a methodology disclosure.
- **Stormont sessions feed** — chronological plenary sittings with per-MLA participation detail; an on-chain verification dropdown proves the session data hasn't been altered; a Hansard-grounded chatbot for asking questions about a session.
- **Pricing** — Free / Newsroom (£99/mo) / Enterprise tiers. Demo mode is entered from the pricing page.

### MLA tracker

A reading layer over real plenary Hansard transcripts: session summaries, a bee-swarm visualisation of MLA activity, party and MLA pages, methodology notes, and AI-generated manifesto-vs-reality reports — all with the same on-chain verification panels.

> **Data honesty:** coverage is currently 14 of 90 MLAs. Assembly votes, the Register of Members' Interests, and Electoral Commission donation/spending figures are real; some declared-interest, donation, and per-MLA engagement rows are illustrative synthetic data, disclosed in-product. The Solana stamping currently runs on devnet (identical mechanism to mainnet; production is a config change).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4, Recharts |
| Backend | FastAPI, Motor (async MongoDB) |
| Chatbot service | FastAPI RAG service over Hansard transcripts (Anthropic) |
| Database | MongoDB Atlas (Ireland region) |
| Blockchain | Solana — SPL Memo program (devnet), `solders` / Solana Python SDK; client verification via Web Crypto API |
| Audio | ElevenLabs text-to-speech |
| Deploy | Vercel (frontend), Railway (backend) |
| Data sources | NI Assembly Hansard & voting records, Register of Members' Interests, UK Electoral Commission |

---

## Project structure

```
/
├── frontend/                       # Next.js app (Vercel)
│   ├── app/
│   │   ├── page.tsx                # redirect → animated homepage
│   │   ├── quiz/                   # 10-step quiz flow
│   │   ├── results/                # alignment chart + audio + MLA cards
│   │   ├── party/[id]/             # party scorecard + promise tracker
│   │   ├── mla/[id]/               # MLA profile (4 tabs)
│   │   ├── chain-demo/             # standalone verification test harness
│   │   ├── pro/                    # VoteWise Pro: overview, donations,
│   │   │                           #   attendance, sessions, pricing
│   │   ├── tracker/                # Hansard reading layer + reports
│   │   └── components/
│   │       ├── ChainPanel.tsx      # Solana verification UI
│   │       ├── VerifiedBadge.tsx   # green verified pill
│   │       └── tracker/, pro/      # feature-specific components
│   └── public/
│       ├── html/index.html         # animated homepage (static)
│       ├── images/                 # party logos + Stormont photo
│       ├── audio/                  # ElevenLabs result briefings (7 files)
│       └── methodology.md
│
├── backend/                        # FastAPI app (Railway)
│   ├── main.py                     # core endpoints + admin one-shots
│   ├── routers/
│   │   ├── quiz_router.py          # /quiz/questions, /quiz/score
│   │   └── pro_router.py           # /pro/* analytics endpoints
│   ├── services/
│   │   ├── alignment_service.py    # party + MLA scoring engine
│   │   └── solana_service.py       # canonical hash + Memo tx + DB upsert
│   ├── seed/                       # seed parties, MLAs, donations,
│   │   │                           #   spending, sessions; chain-verify all
│   ├── generate_audio.py           # one-shot ElevenLabs briefings generator
│   └── data/                       # quiz_questions, party_positions,
│                                   #   audio_scripts, EC CSVs, sessions
│
├── backend-tracker/                # RAG chatbot service over Hansard
├── data/mla-tracker/               # processed Hansard sessions, embeddings,
│                                   #   pledges, reports
└── scripts/mla-tracker/            # Hansard / register / voting scrapers
```

---

## Quickstart

### Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB Atlas cluster (or any MongoDB)

### Backend

```bash
cd backend
pip install -r requirements.txt

# .env
echo "MONGODB_URI=your_atlas_connection_string" > .env
echo "SOLANA_PRIVATE_KEY=your_devnet_key" >> .env
echo "ELEVENLABS_API_KEY=optional_for_audio_regen" >> .env
echo "ANTHROPIC_API_KEY=optional_for_chatbot" >> .env

# seed the database
python -m backend.seed.seed_real_parties
python -m backend.seed.seed_real_mlas
python -m backend.seed.seed_party_donations
python -m backend.seed.seed_party_spending
python -m backend.seed.seed_stormont_sessions

# stamp every MLA profile on Solana devnet
python -m backend.seed.run_chain_verify_all

# run
uvicorn main:app --reload   # → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install

# .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev   # → http://localhost:3000
```

### Tracker chatbot service (optional)

```bash
cd backend-tracker
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

---

## API reference

### Voter product

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/parties` | All 7 parties |
| GET | `/party/{id}` | Single party with full scorecard |
| GET | `/party/{id}/mlas` | MLAs for a party |
| GET | `/mla/{id}` | Full MLA profile |
| GET | `/quiz/questions` | 10 quiz questions |
| POST | `/quiz/score` | Score answers, return party + MLA alignment |
| GET | `/politician/{id}/chain` | Chain verification record |
| POST | `/chain/verify/{id}` | (Re)stamp profile on Solana |

### Pro analytics (`/pro/*`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/pro/health` | Dataset freshness timestamps |
| GET | `/pro/donations/parties` · `/top-donors` · `/timeseries` | Electoral Commission donations |
| GET | `/pro/spending/parties` · `/timeseries` · `/top-categories` | Campaign spending |
| GET | `/pro/attendance/mlas` · `/attendance/timeseries` | Attendance |
| GET | `/pro/engagement/leaderboard` | Engagement scores |
| GET | `/pro/sessions/latest` · `/pro/sessions/{id}` | Plenary session feed + detail |

### Quiz score request

```json
{ "answers": [ { "id": "q1", "value": 2 }, { "id": "q2", "value": -1 } ] }
```

### Quiz score response

```json
{
  "party_alignment": [
    { "party_id": "party_alliance", "name": "Alliance Party", "alignment_pct": 88, "color": "#F6CB2F" }
  ],
  "top_match": "party_alliance",
  "mla_alignment": [
    { "mla_id": "mla_naomi_long", "name": "Naomi Long", "party_id": "party_alliance", "alignment_pct": 91 }
  ]
}
```

---

## Alignment scoring

For each policy axis, distance = `|user_answer − party_position|`, with a max of 4 per axis. Summed across the answered axes:

```
alignment % = 100 − (total_distance / (axes_answered × 4) × 100)
```

MLA scores use that MLA's own vote record per axis (`stance_value`, −2..+2), falling back to their party's position for any axis with no recorded vote. Party positions are derived from voting records and manifesto-delivery reviews.

---

## Blockchain verification

1. The MLA (or session) document is serialised to canonical JSON — recursively sorted keys, no whitespace, non-ASCII escaped as `\uXXXX`.
2. SHA-256 of that string is computed server-side in Python.
3. The hash is written to Solana via the SPL Memo program; the transaction signature, explorer URL, and timestamp are stored in the `chain_state` collection. Re-stamping the same data is idempotent.
4. If a record is later changed, the previous hash is archived to a `changelog` array before the new one is written.

**Verify Now** (in the browser) re-fetches the raw document, recomputes the canonical hash with the Web Crypto API using a byte-identical serialisation, and diffs it against the on-chain hash. A match means the data you're looking at is the data that was stamped. No trust in VoteWise's servers required.

---

## The seven parties

| Party | Short | Colour | Seats (2022) |
|---|---|---|---|
| Alliance Party | Alliance | `#F6CB2F` | 17 |
| Democratic Unionist Party | DUP | `#D4213D` | 25 |
| Sinn Féin | SF | `#326760` | 27 |
| Ulster Unionist Party | UUP | `#48A5DD` | 9 |
| SDLP | SDLP | `#2E9A41` | 12 |
| People Before Profit | PBP | `#C0392B` | 1 |
| Traditional Unionist Voice | TUV | `#4A7AB5` | 1 |

---

## Team

- **Rehan** — backend, data seeding, MLA profiles, API, integration
- **Ryan** — quiz logic, alignment engine, results page, ElevenLabs audio, Hansard chatbot
- **Conor** — frontend design, homepage, demo
- **Das** — Solana integration, on-chain verification
- **Ishaaq** — business model, consulting, project management

---

## Licence

MIT
