import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

from routers.quiz_router import router as quiz_router
app.include_router(quiz_router)

# TODO: uncomment once Ryan's routers/quiz_router.py exists on disk.
# from routers.quiz_router import router as quiz_router
# app.include_router(quiz_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_mongo_client: AsyncIOMotorClient | None = None
_chain_state_cache: dict = {}
_politician_cache: dict = {
    "pol_001": {"politician_id": "pol_001", "stub": True},
}


def get_db():
    global _mongo_client
    if _mongo_client is None:
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=3000)
    return _mongo_client["mandatewatch"]


async def _get_chain_record(politician_id: str) -> dict | None:
    """Shared lookup for chain_state — used by all /chain endpoints."""
    try:
        db = get_db()
        await db.command("ping")
        return await db.chain_state.find_one(
            {"politician_id": politician_id}, {"_id": 0}
        )
    except Exception:
        return _chain_state_cache.get(politician_id)


async def _get_mla(mla_id: str) -> dict | None:
    """Shared MLA lookup — used by /mla/{id} and /politician/{id}."""
    db = get_db()
    return await db["mlas"].find_one({"_id": mla_id})


# ------------------------------------------------------------------ health

@app.get("/health")
def health():
    return {"status": "ok"}


# ------------------------------------------------------------------ parties

@app.get("/parties")
async def get_parties():
    db = get_db()
    return await db["parties"].find({}).to_list(None)


@app.get("/party/{party_id}")
async def get_party(party_id: str):
    db = get_db()
    party = await db["parties"].find_one({"_id": party_id})
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


@app.get("/party/{party_id}/mlas")
async def get_party_mlas(party_id: str):
    db = get_db()
    return await db["mlas"].find({"party_id": party_id}).to_list(None)


# --------------------------------------------------------------------- MLAs

@app.get("/mla/{mla_id}")
async def get_mla(mla_id: str):
    mla = await _get_mla(mla_id)
    if not mla:
        raise HTTPException(status_code=404, detail="MLA not found")
    return mla


@app.get("/mla/{mla_id}/chain")
async def mla_chain(mla_id: str):
    record = await _get_chain_record(mla_id)
    if not record:
        raise HTTPException(status_code=404, detail="Not verified yet")
    return record


# ----------------------------------------- legacy /politician/* (kept for VerifiedBadge / ChainPanel)

@app.get("/politician/{politician_id}")
async def get_politician(politician_id: str):
    mla = await _get_mla(politician_id)
    if mla:
        return mla
    return {"politician_id": politician_id, "stub": True}


@app.get("/politician/{politician_id}/chain")
async def politician_chain(politician_id: str):
    record = await _get_chain_record(politician_id)
    if not record:
        raise HTTPException(status_code=404, detail="Not verified yet")
    return record


@app.get("/chain/status/{politician_id}")
async def chain_status(politician_id: str):
    record = await _get_chain_record(politician_id)
    if not record:
        raise HTTPException(status_code=404, detail="Not verified yet")
    return record


# ----------------------------------------- chain verification (Solana — Das's domain)

@app.post("/chain/verify/{politician_id}")
async def chain_verify(politician_id: str):
    from services.solana_service import verify_profile_on_chain

    profile_data = _politician_cache.get(politician_id, {"politician_id": politician_id, "stub": True})
    try:
        db = get_db()
        politician = await db.politicians.find_one({"_id": politician_id})
        if politician:
            politician.pop("_id", None)
            profile_data = politician
    except Exception:
        pass  # MongoDB unavailable — use cached/stub profile
    _politician_cache[politician_id] = profile_data

    class MemDB:
        class chain_state:
            @staticmethod
            async def find_one(*a, **kw):
                return _chain_state_cache.get(politician_id)
            @staticmethod
            async def update_one(filter, update, **kw):
                rec = update.get("$set", {})
                _chain_state_cache[rec.get("politician_id", politician_id)] = rec

    try:
        db = get_db()
        await db.command("ping")
        result = await verify_profile_on_chain(politician_id, profile_data, db)
    except Exception:
        result = await verify_profile_on_chain(politician_id, profile_data, MemDB())

    return result
