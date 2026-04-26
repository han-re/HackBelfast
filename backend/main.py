import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

from routers.quiz_router import router as quiz_router
app.include_router(quiz_router)

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


@app.get("/health")
def health():
    return {"status": "ok"}


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


@app.get("/politician/{politician_id}")
async def get_politician(politician_id: str):
    return {"politician_id": politician_id, "stub": True}


@app.get("/chain/status/{politician_id}")
async def chain_status(politician_id: str):
    db = get_db()
    record = await db.chain_state.find_one(
        {"politician_id": politician_id}, {"_id": 0}
    )
    if not record:
        raise HTTPException(status_code=404, detail="Not verified yet")
    return record


@app.get("/parties")
async def get_parties():
    db = get_db()
    parties = await db["Parties"].find({}, {"_id": 0}).to_list(None)
    return parties


@app.get("/politician/{politician_id}/chain")
async def politician_chain(politician_id: str):
    try:
        db = get_db()
        await db.command("ping")
        record = await db.chain_state.find_one({"politician_id": politician_id}, {"_id": 0})
    except Exception:
        record = _chain_state_cache.get(politician_id)

    if not record:
        raise HTTPException(status_code=404, detail="Not verified yet")
    return record
