"""
Generate ElevenLabs audio briefings for all 7 parties.
Run once from the backend/ directory:

    ELEVENLABS_API_KEY=your_key python generate_audio.py

Output: ../frontend/public/audio/result-{party_id}.mp3
"""

import json
import os
import sys
from pathlib import Path

import requests

DATA_DIR = Path(__file__).parent / "data"
OUTPUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "audio"

# ElevenLabs voice — "Callum" is calm, measured, suitable for political content.
# Override by setting ELEVENLABS_VOICE_ID env var.
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "N2lVS1w4EtoT3dr4eOWO")
MODEL_ID = "eleven_turbo_v2_5"
API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"


def generate(api_key: str, party_id: str, script: str) -> None:
    output_path = OUTPUT_DIR / f"result-{party_id}.mp3"

    if output_path.exists():
        print(f"  SKIP  {party_id} — file already exists ({output_path.name})")
        return

    print(f"  GEN   {party_id} ...", end=" ", flush=True)

    resp = requests.post(
        API_URL,
        params={"output_format": "mp3_44100_128"},
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        json={
            "text": script,
            "model_id": MODEL_ID,
            "voice_settings": {
                "stability": 0.55,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True,
            },
        },
        timeout=60,
    )

    if resp.status_code != 200:
        print(f"FAILED — HTTP {resp.status_code}: {resp.text[:200]}")
        return

    output_path.write_bytes(resp.content)
    size_kb = len(resp.content) // 1024
    print(f"OK ({size_kb} KB)")


def main() -> None:
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not api_key:
        print("Error: ELEVENLABS_API_KEY environment variable is not set.")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    scripts_path = DATA_DIR / "audio_scripts.json"
    with open(scripts_path) as f:
        scripts: dict[str, str] = json.load(f)

    print(f"Generating {len(scripts)} audio files to {OUTPUT_DIR}\n")
    for party_id, script in scripts.items():
        generate(api_key, party_id, script)

    print("\nDone. Commit frontend/public/audio/ to the repo.")


if __name__ == "__main__":
    main()
