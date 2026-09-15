"""Local sanity check for normalize_category — no API calls, no DB."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from services.gemini_extractor import normalize_category

cases = [
    ("mechanical", ""),   # yesterday's search failure -> should map or drop
    ("repairs", "Other"),
    ("repair", "Other"),
    ("carpenter", "Other"),
    ("electrical work", "Other"),
    ("vulcanizer", ""),
    ("cleaning services", "Other"),
    ("General", ""),
    ("", "Other"),
    ("tailoring", ""),
]
for raw, fb in cases:
    print(f"{raw!r:<22} -> {normalize_category(raw, fb)!r}")
