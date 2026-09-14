"""Zips the recordings in benchmarks/audio/ for upload to Google Colab.

Run locally after your friends' recordings are collected:

    python compress_audio.py

Checks (the same ones Colab will do) BEFORE zipping, so a bad filename
fails here instead of silently mislabeling your benchmark:
  1. Exactly 20 audio files present.
  2. Filenames sort alphabetically in the intended sample order (zero-padded
     names like note01..note20 are required — note1, note10, note2 sorts wrong).

Output: audio.zip next to this script — drag it into the Colab file browser
root (/content); the notebook's ingestion cell extracts it automatically.
"""

import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
AUDIO_DIR = HERE / "audio"
OUTPUT = HERE / "audio.zip"
EXPECTED_COUNT = 20
AUDIO_EXTS = {".m4a", ".aac", ".opus", ".mp3", ".ogg", ".wav", ".amr", ".3gp", ".mp4"}


def main():
    if not AUDIO_DIR.is_dir():
        sys.exit(f"Missing folder: {AUDIO_DIR}\nCreate benchmarks/audio/ and drop the 20 recordings in it.")

    files = sorted(
        [f for f in AUDIO_DIR.iterdir() if f.is_file() and f.suffix.lower() in AUDIO_EXTS],
        key=lambda f: f.name.lower(),
    )

    print(f"Found {len(files)} audio file(s):")
    for f in files:
        print(f"  {f.name}")

    if len(files) != EXPECTED_COUNT:
        sys.exit(f"\nERROR: expected {EXPECTED_COUNT} files, found {len(files)}.")

    print("\nThese will map to sample_01..sample_20 in the order listed above.")
    ok = input("Is this order correct? (y/n): ").strip().lower()
    if ok != "y":
        sys.exit("Aborted — rename the files so they sort in script order (zero-pad: note01..note20), then rerun.")

    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            zf.write(f, arcname=f.name)

    size_mb = OUTPUT.stat().st_size / (1024 * 1024)
    print(f"\nDone: {OUTPUT} ({size_mb:.1f} MB)")
    print("Upload it to Colab: drag audio.zip into the file browser root (/content).")


if __name__ == "__main__":
    main()
