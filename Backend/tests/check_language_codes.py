"""Compare Sahara STT output for the same clip with different language codes.

One Sahara API call per language listed in LANGS. No Gemini, no DB.

    python tests/check_language_codes.py
"""

import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

# Yoruba output contains underdot characters (ẹ, ọ) that cp1252 can't print.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from services.sahara_client import transcribe  # noqa: E402

CLIP = Path(__file__).resolve().parents[2] / "benchmarks" / "audio" / "note11.wav"
LANGS = ["yo"]  # add e.g. "en" here to compare more codes


async def main():
    audio = CLIP.read_bytes()
    print(f"Clip: {CLIP.name} "
          f"(ground truth: 'Welder dey this area? Iron gate hinge don cut "
          f"for Ojuelegba, 4500 naira dey.')\n")
    for lang in LANGS:
        try:
            text = await transcribe(audio, lang=lang, filename=CLIP.name)
            print(f"[{lang}] {text}")
        except Exception as exc:
            print(f"[{lang}] FAILED: {exc}")


asyncio.run(main())
