# Mandate

**Vote for the policy, not the tribe.**

Northern Ireland has 90 MLAs making decisions on housing, health, and education — but most people vote based on identity, not policy. Mandate breaks that pattern. Take a 90-second quiz, get a data-driven alignment score against every party's actual Assembly voting record, and find out who really represents you.

Built at HackBelfast 2026.

---

## Live Demo

| | URL |
|---|---|
| Frontend | https://hack-belfast.vercel.app |
| Backend API | https://hackbelfast-production.up.railway.app |

---

## Features

- **Policy quiz** — 10 questions across housing, health, education, climate, equality, economy, welfare, integration, and legacy. Five-point Likert scale, auto-advances on selection.
- **Alignment engine** — scores your answers against each party's revealed voting record (not manifesto rhetoric). Ranks all 7 NI parties and surfaces your top 6 MLA matches.
- **Party scorecards** — full promise tracker for all 7 parties. Every commitment marked kept, in progress, or broken, with evidence and source links.
- **MLA profiles** — voting record, declared interests, donations, party-line voting percentage, and constituency for 14 MLAs across all 7 parties.
- **Blockchain verification** — every MLA profile is SHA-256 fingerprinted and stamped on Solana devnet. The Verify Now button recomputes the hash in your browser and compares it to the on-chain record. Silent edits are publicly detectable.
- **Audio briefings** — ElevenLabs-generated 90-second personalised briefing plays automatically on your results page.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind 4 |
| Backend | FastAPI, Motor (async MongoDB) |
| Database | MongoDB Atlas (Ireland region) |
| Blockchain | Solana devnet — Memo program |
| Audio | ElevenLabs |
| Deploy | Vercel (frontend), Railway (backend) |

---

## Project Structure

```
/
├── frontend/               # Next.js app (Vercel)
│   ├── app/
│   │   ├── page.tsx        # Homepage redirect
│   │   ├── quiz/           # Quiz flow
│   │   ├── results/        # Results + bar chart + audio
│   │   ├── party/[id]/     # Party scorecard
│   │   ├── mla/[id]/       # MLA profile (4 tabs)
│   │   └── components/
│   │       ├── ChainPanel.tsx    # Solana verification UI
│   │       └── VerifiedBadge.tsx # Green verified badge
│   └── public/
│       ├── html/index.html # Animated homepage
│       ├── images/         # Party logos + Stormont photo
│       └── audio/          # ElevenLabs result briefings
│
└── backend/                # FastAPI app (Railway)
    ├── main.py             # All API endpoints
    ├── routers/
    │   └── quiz_router.py  # /quiz/questions + /quiz/score
    ├── services/
    │   ├── alignment_service.py  # Scoring engine
    │   └── solana_service.py     # Chain stamping
    ├── seed/
    │   ├── seed_real_parties.py  # 7 NI parties
    │   ├── seed_real_mlas.py     # 14 MLAs
    │   └── run_chain_verify_all.py
    └── data/
        ├── quiz_questions.json   # 10 questions
        └── party_positions.json  # Party stances per axis
```

---

## Quickstart

### Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB Atlas cluster
- Railway account (or any server for FastAPI)

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env
echo "MONGODB_URI=your_atlas_connection_string" > .env
echo "SOLANA_PRIVATE_KEY=your_devnet_key" >> .env

# Seed the database
python -m backend.seed.seed_real_parties
python -m backend.seed.seed_real_mlas

# Run
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
# → http://localhost:3000
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/parties` | All 7 parties |
| GET | `/party/{id}` | Single party with full scorecard |
| GET | `/party/{id}/mlas` | MLAs for a party |
| GET | `/mla/{id}` | Full MLA profile |
| GET | `/quiz/questions` | 10 quiz questions |
| POST | `/quiz/score` | Score answers, return alignment |
| GET | `/politician/{id}/chain` | Chain verification record |
| POST | `/chain/verify/{id}` | Stamp profile on Solana |

### Quiz score request

```json
{
  "answers": [
    { "id": "q1", "value": 2 },
    { "id": "q2", "value": -1 }
  ]
}
```

### Quiz score response

```json
{
  "party_alignment": [
    { "party_id": "party_alliance", "name": "Alliance Party", "alignment_pct": 88, "color": "#F6CB2F" }
  ],
  "top_match": "party_alliance",
  "mla_alignment": [
    { "mla_id": "mla_naomi_long", "name": "Naomi Long", "alignment_pct": 91 }
  ]
}
```

---

## Alignment Scoring

For each policy axis, distance = `|user_answer − party_position|`. Max distance per axis = 4. Across all 10 axes, max total = 40.

```
alignment % = 100 − (total_distance / 40 × 100)
```

MLA scores use their individual vote record per axis, falling back to their party's position for any axis without a recorded vote.

---

## Blockchain Verification

1. MLA profile data is serialised to canonical JSON (sorted keys, no spaces)
2. SHA-256 hash computed server-side in Python
3. Hash written to Solana devnet via the Memo program
4. `chain_state` record stored in MongoDB with hash and tx signature

**Verify Now** recomputes the hash client-side using the Web Crypto API and diffs it against the stored hash. No trust in Mandate's servers required. If the database is altered after stamping, verification fails publicly.

---

## The Seven Parties

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

Built in 8 hours at HackBelfast 2026.

- **Rehan** — backend, data seeding, MLA profiles, API
- **Ryan** — quiz logic, alignment engine, results page, ElevenLabs audio
- **Conor** — frontend design, homepage, demo recording
- **Das** — Solana integration, blockchain verification

---

## Licence

MIT
