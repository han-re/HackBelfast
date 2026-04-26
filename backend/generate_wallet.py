from solders.keypair import Keypair
import base58

kp = Keypair()
pub = str(kp.pubkey())
priv = base58.b58encode(bytes(kp)).decode()

print("PUBLIC KEY:", pub)
print("PRIVATE KEY:", priv)

with open("keys.txt", "w") as f:
    f.write(f"PUBLIC KEY: {pub}\n")
    f.write(f"PRIVATE KEY: {priv}\n")

print("\nSaved to keys.txt")
