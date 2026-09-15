"""One-time local conversion: standardizes the recordings in benchmarks/audio/
to 16kHz / 16-bit PCM / mono / peak-normalized WAV, named sample_NN.wav
(matching dataset.json and the Colab notebook).

Same logic as the notebook's standardize() so results are identical whether
conversion happens here or in Colab. Originals are replaced by the converted
files (keeping both would double-count files and break the sample mapping).
"""

import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

AUDIO_DIR = Path(__file__).resolve().parent / "audio"
AUDIO_EXTS = {".m4a", ".aac", ".opus", ".mp3", ".ogg", ".wav", ".amr", ".3gp", ".mp4"}
TMP_DIR = AUDIO_DIR / "_tmp"


def standardize(src: Path, dst: Path):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-ar", "16000", "-ac", "1", "-f", "wav", str(dst)],
        check=True, capture_output=True,
    )
    audio, sr = sf.read(dst, dtype="float32")
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio * (0.95 / peak)
    sf.write(dst, audio, sr, subtype="PCM_16")


def main():
    files = sorted(
        [f for f in AUDIO_DIR.iterdir() if f.is_file() and f.suffix.lower() in AUDIO_EXTS],
        key=lambda f: f.name.lower(),
    )
    TMP_DIR.mkdir(exist_ok=True)
    converted = []

    for f in files:
        # Target name: first digit run in the stem, zero-padded -> sample_NN.wav.
        match = re.search(r"\d+", f.stem)
        if not match:
            print(f"SKIPPED (no number in name): {f.name}")
            continue
        dst_name = f"sample_{int(match.group()):02d}.wav"
        dst = TMP_DIR / dst_name
        standardize(f, dst)
        converted.append((f, dst))
        print(f"{f.name:<25} -> {dst_name}")

    # Only replace originals once every conversion succeeded.
    for orig, dst in converted:
        orig.unlink()
        dst.rename(AUDIO_DIR / dst.name)
    TMP_DIR.rmdir()

    print(f"\n{len(converted)} files standardized. Final contents:")
    for f in sorted(AUDIO_DIR.iterdir()):
        info = sf.info(f)
        print(f"  {f.name:<15} {info.samplerate} Hz, {info.channels} ch, {info.subtype}, {info.duration:.1f}s")


if __name__ == "__main__":
    main()
