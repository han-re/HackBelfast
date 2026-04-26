"""
Solana integration test suite.
Runs all tests that can be validated without on-chain funds,
plus the live transaction test (requires devnet SOL).
"""
import asyncio, hashlib, json, os, sys, base58
from dotenv import load_dotenv

load_dotenv()

PASS = "[PASS]"
FAIL = "[FAIL]"
SKIP = "[SKIP]"

results = []

def check(name, condition, detail=""):
    status = PASS if condition else FAIL
    results.append((status, name))
    print(f"  {status}  {name}")
    if detail:
        print(f"         {detail}")
    return condition


# ─────────────────────────────────────────────
# TEST 1 — Dependencies importable
# ─────────────────────────────────────────────
print("\n[1] Dependency imports")
try:
    from solders.keypair import Keypair
    from solders.pubkey import Pubkey
    from solders.instruction import Instruction, AccountMeta
    from solders.message import Message
    from solders.transaction import Transaction
    from solana.rpc.api import Client
    check("solders importable", True)
    check("solana-py importable", True)
except ImportError as e:
    check("solders importable", False, str(e))
    sys.exit(1)


# ─────────────────────────────────────────────
# TEST 2 — Wallet loads from .env
# ─────────────────────────────────────────────
print("\n[2] Wallet configuration")
raw_key = os.getenv("SOLANA_PRIVATE_KEY", "")
wallet = None

has_key = check("SOLANA_PRIVATE_KEY set in .env", bool(raw_key))
if has_key:
    try:
        wallet = Keypair.from_bytes(base58.b58decode(raw_key))
        check("Private key decodes to valid keypair", True,
              f"Public key: {wallet.pubkey()}")
    except Exception as e:
        check("Private key decodes to valid keypair", False, str(e))


# ─────────────────────────────────────────────
# TEST 3 — Profile hashing
# ─────────────────────────────────────────────
print("\n[3] Profile hashing")
from services.solana_service import hash_profile

profile_a = {"name": "John Smith", "company": "Acme Corp", "donation": 10000}
profile_b = {"company": "Acme Corp", "donation": 10000, "name": "John Smith"}  # different order
profile_c = {"name": "Jane Doe", "company": "Acme Corp", "donation": 10000}

hash_a = hash_profile(profile_a)
hash_b = hash_profile(profile_b)
hash_c = hash_profile(profile_c)

check("Hash is 64-char hex string", len(hash_a) == 64 and all(c in "0123456789abcdef" for c in hash_a),
      f"hash: {hash_a}")
check("Same data, different key order -> identical hash", hash_a == hash_b,
      "(sort_keys=True ensures canonical JSON)")
check("Different profile → different hash", hash_a != hash_c)


# ─────────────────────────────────────────────
# TEST 4 — Transaction building (no broadcast)
# ─────────────────────────────────────────────
print("\n[4] Transaction construction")
if wallet:
    try:
        MEMO_PROGRAM = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")
        test_hash = hash_profile(profile_a)
        memo_ix = Instruction(
            program_id=MEMO_PROGRAM,
            accounts=[AccountMeta(pubkey=wallet.pubkey(), is_signer=True, is_writable=False)],
            data=test_hash.encode("utf-8"),
        )
        check("Memo instruction built", True)
        check("Instruction data matches profile hash",
              memo_ix.data == test_hash.encode("utf-8"))

        # Build with a dummy blockhash to validate message structure
        from solders.hash import Hash
        dummy_blockhash = Hash.default()
        msg = Message.new_with_blockhash([memo_ix], wallet.pubkey(), dummy_blockhash)
        tx = Transaction([wallet], msg, dummy_blockhash)
        check("Transaction signed successfully", True)
    except Exception as e:
        check("Memo instruction built", False, str(e))
else:
    print(f"  {SKIP}  Transaction building (no wallet configured)")


# ─────────────────────────────────────────────
# TEST 5 — Devnet connectivity
# ─────────────────────────────────────────────
print("\n[5] Devnet RPC connectivity")
connection = Client("https://api.devnet.solana.com")
rpc_ok = False
balance_sol = 0.0

try:
    version = connection.get_version()
    rpc_ok = True
    check("Devnet RPC reachable", True, f"Solana version: {version.value.solana_core}")
except Exception as e:
    check("Devnet RPC reachable", False, str(e))

if rpc_ok and wallet:
    try:
        bal = connection.get_balance(wallet.pubkey())
        balance_sol = bal.value / 1e9
        has_sol = balance_sol > 0
        check(f"Wallet has devnet SOL", has_sol,
              f"Balance: {balance_sol} SOL — {'ready for real TX' if has_sol else 'needs airdrop from faucet.solana.com'}")
    except Exception as e:
        check("Balance check", False, str(e))


# ─────────────────────────────────────────────
# TEST 6 — Live transaction (needs SOL)
# ─────────────────────────────────────────────
print("\n[6] Live on-chain transaction")

async def run_live_tx():
    if not wallet:
        print(f"  {SKIP}  No wallet configured")
        return

    if balance_sol == 0:
        print(f"  {SKIP}  Wallet empty — fund at https://faucet.solana.com")
        print(f"         Address: {wallet.pubkey()}")
        results.append((SKIP, "Live transaction broadcast"))
        return

    # Use a mock DB that just accepts writes
    class MockDB:
        class chain_state:
            @staticmethod
            async def update_one(*a, **kw):
                pass

    from services.solana_service import verify_profile_on_chain
    demo_profile = {"name": "Demo Politician", "party": "Demo Party", "donations": 50000}
    result = await verify_profile_on_chain("demo_live_test", demo_profile, MockDB())

    if not result["fallback"]:
        check("Real transaction broadcast and confirmed", True,
              f"TX: {result['tx_signature']}")
        print(f"\n  EXPLORER: {result['explorer_url']}")
        results.append((PASS, "Live transaction broadcast"))
    else:
        check("Live transaction (fallback used)", False,
              "Check wallet balance and RPC connectivity")
        results.append((FAIL, "Live transaction broadcast"))

asyncio.run(run_live_tx())


# ─────────────────────────────────────────────
# TEST 7 — Fallback mechanism
# ─────────────────────────────────────────────
print("\n[7] Fallback mechanism")

async def run_fallback_test():
    class MockDB:
        class chain_state:
            @staticmethod
            async def update_one(*a, **kw):
                pass

    # Temporarily break the wallet to force fallback
    import services.solana_service as svc
    original_wallet = svc.wallet
    svc.wallet = None

    from services.solana_service import verify_profile_on_chain
    result = await verify_profile_on_chain("fallback_test_id", {"name": "Test"}, MockDB())

    svc.wallet = original_wallet

    check("Fallback returns valid record", isinstance(result, dict))
    check("Fallback record has politician_id", result.get("politician_id") == "fallback_test_id")
    check("Fallback record has profile_hash", bool(result.get("profile_hash")))
    check("Fallback record has verified_at", bool(result.get("verified_at")))
    check("Fallback flag is True", result.get("fallback") is True)

asyncio.run(run_fallback_test())


# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
print("\n" + "="*50)
passed  = sum(1 for s, _ in results if s == PASS)
failed  = sum(1 for s, _ in results if s == FAIL)
skipped = sum(1 for s, _ in results if s == SKIP)
print(f"Results:  {passed} passed  |  {failed} failed  |  {skipped} skipped")
if failed:
    print("\nFailed tests:")
    for s, name in results:
        if s == FAIL:
            print(f"  - {name}")
print("="*50)
