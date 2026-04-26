import asyncio, hashlib, json, os, base58, datetime
from solders.keypair import Keypair
from solana.rpc.api import Client
from dotenv import load_dotenv

load_dotenv()

connection = Client("https://api.devnet.solana.com")
_raw_key = os.getenv("SOLANA_PRIVATE_KEY", "")
wallet = Keypair.from_bytes(base58.b58decode(_raw_key)) if _raw_key else None


def hash_profile(data: dict) -> str:
    # separators=(',',':') removes spaces → matches JavaScript JSON.stringify output exactly
    canonical = json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()


def _send_memo(profile_hash: str) -> str:
    from solders.transaction import Transaction
    from solders.instruction import Instruction, AccountMeta
    from solders.pubkey import Pubkey
    from solders.message import Message

    MEMO_PROGRAM = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")
    memo_ix = Instruction(
        program_id=MEMO_PROGRAM,
        accounts=[AccountMeta(pubkey=wallet.pubkey(), is_signer=True, is_writable=False)],
        data=profile_hash.encode("utf-8"),
    )
    blockhash_resp = connection.get_latest_blockhash()
    recent_blockhash = blockhash_resp.value.blockhash
    msg = Message.new_with_blockhash([memo_ix], wallet.pubkey(), recent_blockhash)
    tx = Transaction([wallet], msg, recent_blockhash)
    result = connection.send_transaction(tx)
    return str(result.value)


async def verify_profile_on_chain(
    politician_id: str, profile_data: dict, db
) -> dict:
    profile_hash = hash_profile(profile_data)
    now = datetime.datetime.utcnow().isoformat()

    # Check if we already have a record for this politician
    existing = None
    try:
        existing = await db.chain_state.find_one({"politician_id": politician_id})
    except Exception:
        pass

    # If hash unchanged, return the existing record — no new tx needed
    if existing and existing.get("profile_hash") == profile_hash:
        existing.pop("_id", None)
        return existing

    try:
        if not wallet:
            raise ValueError("No wallet configured")

        tx_signature = await asyncio.to_thread(_send_memo, profile_hash)

        record = {
            "politician_id": politician_id,
            "tx_signature": tx_signature,
            "profile_hash": profile_hash,
            "explorer_url": f"https://explorer.solana.com/tx/{tx_signature}?cluster=devnet",
            "verified_at": now,
            "network": "devnet",
            "fallback": False,
        }

    except Exception as e:
        print(f"Solana error (non-fatal): {e}")
        record = {
            "politician_id": politician_id,
            "tx_signature": f"DEVNET_{politician_id[:8].upper()}",
            "profile_hash": profile_hash,
            "explorer_url": "https://explorer.solana.com/?cluster=devnet",
            "verified_at": now,
            "network": "devnet",
            "fallback": True,
        }

    try:
        # If there was a previous record with a different hash, archive it to changelog
        if existing and existing.get("profile_hash") != profile_hash:
            changelog_entry = {
                "tx_signature": existing.get("tx_signature"),
                "profile_hash": existing.get("profile_hash"),
                "explorer_url": existing.get("explorer_url"),
                "verified_at":  existing.get("verified_at"),
                "replaced_at":  now,
            }
            await db.chain_state.update_one(
                {"politician_id": politician_id},
                {"$push": {"changelog": changelog_entry}},
            )

        await db.chain_state.update_one(
            {"politician_id": politician_id},
            {"$set": record},
            upsert=True,
        )
    except Exception as db_err:
        print(f"DB write error (non-fatal): {db_err}")

    return record
