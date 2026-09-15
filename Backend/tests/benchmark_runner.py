"""Benchmark runner: compares Sahara STT vs Whisper vs Gemini on Nigerian
Pidgin-English code-switched audio, plus Gemini intent-extraction accuracy.

Two data modes:
  1. Local (default when Backend/tests/test_audio/ exists with .wav files
     and a ground_truth.csv). CSV columns: filename, transcript.
  2. Hugging Face AfriSwitch dataset (streaming) otherwise.

Outputs benchmark_results.csv and a BENCHMARK.md report one level up
(project root).
"""

import asyncio
import csv
import io
import os
import re
import sys
from pathlib import Path

import httpx
import jiwer
import pandas as pd
import soundfile as sf
from google import genai
from openai import AsyncOpenAI

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services import gemini_extractor  # noqa: E402

TEST_AUDIO_DIR = Path(__file__).resolve().parent / "test_audio"
RESULTS_CSV = Path(__file__).resolve().parent / "benchmark_results.csv"
REPORT_MD = Path(__file__).resolve().parent.parent.parent / "BENCHMARK.md"

SAHARA_API_KEY = os.getenv("SAHARA_API_KEY", "")
SAHARA_ENDPOINT = "https://infer.voice.intron.io/file/v1/upload"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

whisper_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# ---------------------------------------------------------------- normalization
def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def extract_code_switched_spans(tagged_text: str) -> str:
    """Extracts words inside [[EN]] ... [[/EN]] tags for Point-of-Interest evaluation."""
    matches = re.findall(r"\[\[EN\]\](.*?)\[\[/EN\]\]", tagged_text, flags=re.IGNORECASE)
    return normalize_text(" ".join(matches))


# ---------------------------------------------------------------- model calls
async def transcribe_sahara(client: httpx.AsyncClient, audio_bytes: bytes) -> str:
    try:
        headers = {"Authorization": f"Bearer {SAHARA_API_KEY}"}
        files = {"audio": ("sample.wav", audio_bytes, "audio/wav")}
        res = await client.post(SAHARA_ENDPOINT, headers=headers, files=files, timeout=30.0)
        return res.json().get("transcript", "")
    except Exception as e:
        return f"[SAHARA ERROR: {str(e)}]"


async def transcribe_whisper(audio_bytes: bytes) -> str:
    try:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "sample.wav"
        transcription = await whisper_client.audio.transcriptions.create(
            model="whisper-1",  # Maps to Whisper large-v3 API
            file=audio_file,
        )
        return transcription.text
    except Exception as e:
        return f"[WHISPER ERROR: {str(e)}]"


async def transcribe_gemini(audio_bytes: bytes) -> str:
    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                "Transcribe this audio verbatim. Capture the exact spoken Nigerian Pidgin and English words without translating.",
                genai.types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
            ],
        )
        return response.text or ""
    except Exception as e:
        return f"[GEMINI ERROR: {str(e)}]"


def intent_extraction_accuracy(transcript: str) -> bool:
    """True when Gemini extracts a task intent with the key fields populated."""
    try:
        intent = gemini_extractor.extract_task_intent(transcript)
        return bool(intent.title) and bool(intent.description)
    except Exception:
        return False


# ---------------------------------------------------------------- data loading
def load_local_samples():
    """Yield (wav_bytes, ground_truth, '') for each file in test_audio/."""
    if not TEST_AUDIO_DIR.is_dir():
        return
    csv_path = TEST_AUDIO_DIR / "ground_truth.csv"
    if not csv_path.is_file():
        return
    truth = {}
    with open(csv_path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            truth[row["filename"].strip()] = row["transcript"].strip()

    for filename, transcript in truth.items():
        wav_path = TEST_AUDIO_DIR / filename
        if not wav_path.is_file():
            print(f"WARNING: {filename} listed in ground_truth.csv but not found, skipping")
            continue
        yield wav_path.read_bytes(), transcript, ""


def load_hf_samples(sample_size: int):
    from datasets import load_dataset

    ds = load_dataset("intronhealth/AfriSwitch", split="test", streaming=True)
    for idx, item in enumerate(ds):
        if idx >= sample_size:
            break
        buffer = io.BytesIO()
        sf.write(buffer, item["audio"]["array"], item["audio"]["sampling_rate"], format="WAV")
        tagged = item.get("transcription_tagged", "")
        yield buffer.getvalue(), item.get("transcription", ""), tagged


# ---------------------------------------------------------------- report
def write_report(df: pd.DataFrame, mode: str, sample_count: int):
    def row(name, prefix):
        return (
            f"| {name} | {df[f'{prefix}_wer'].mean():.4f} | {df[f'{prefix}_cer'].mean():.4f} |"
            f" {df[f'{prefix}_pier'].mean():.4f} |"
        )

    lines = [
        "# Benchmark Report",
        "",
        f"- **Mode:** {mode}",
        f"- **Samples:** {sample_count}",
        f"- **Gemini model:** {GEMINI_MODEL}",
        f"- **Intent extraction accuracy (Gemini):** {df['intent_accuracy'].mean() * 100:.1f}%",
        "",
        "## Methodology",
        "",
        "Each audio sample is transcribed by Sahara v2.5, OpenAI Whisper large-v3, and Gemini.",
        "Word Error Rate (WER), Character Error Rate (CER), and Point-of-Interest Error Rate",
        "(PIER — errors on English code-switched spans) are computed against ground truth after",
        "text normalization. Gemini also converts each ground-truth transcript into a structured",
        "task intent; extraction counts as accurate when title and description are populated.",
        "",
        "## Results",
        "",
        "| Model | WER ↓ | CER ↓ | PIER ↓ |",
        "|---|---|---|---|",
        row("Sahara v2.5", "sahara"),
        row("Whisper large-v3", "whisper"),
        row("Gemini", "gemini"),
        "",
        "Per-sample transcripts and scores: `Backend/tests/benchmark_results.csv`.",
    ]
    REPORT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"Report written to {REPORT_MD}")


# ---------------------------------------------------------------- pipeline
async def run_benchmark(sample_size: int = 25):
    samples = list(load_local_samples())
    mode = "local audio (Backend/tests/test_audio/)"
    if not samples:
        print("No local test_audio/ found, falling back to Hugging Face AfriSwitch dataset...")
        samples = list(load_hf_samples(sample_size))
        mode = f"Hugging Face AfriSwitch (first {len(samples)} samples)"

    if not samples:
        print("No benchmark samples available. Add .wav files + ground_truth.csv to test_audio/.")
        return

    results = []
    async with httpx.AsyncClient() as http_client:
        for idx, (wav_bytes, ground_truth, tagged_ground_truth) in enumerate(samples):
            poi_truth = extract_code_switched_spans(tagged_ground_truth)

            sahara_raw, whisper_raw, gemini_raw = await asyncio.gather(
                transcribe_sahara(http_client, wav_bytes),
                transcribe_whisper(wav_bytes),
                transcribe_gemini(wav_bytes),
            )

            ref = normalize_text(ground_truth)
            hyps = {
                "sahara": normalize_text(sahara_raw),
                "whisper": normalize_text(whisper_raw),
                "gemini": normalize_text(gemini_raw),
            }

            entry = {"sample_id": idx + 1, "ground_truth": ground_truth, "poi_truth": poi_truth}
            for prefix, hyp in hyps.items():
                wer = jiwer.wer(ref, hyp) if ref else 0.0
                cer = jiwer.cer(ref, hyp) if ref else 0.0
                pier = jiwer.wer(poi_truth, hyp) if poi_truth else 0.0
                entry[f"{prefix}_transcript"] = {"sahara": sahara_raw, "whisper": whisper_raw, "gemini": gemini_raw}[prefix]
                entry[f"{prefix}_wer"] = round(wer, 4)
                entry[f"{prefix}_cer"] = round(cer, 4)
                entry[f"{prefix}_pier"] = round(pier, 4)

            entry["intent_accuracy"] = intent_extraction_accuracy(ground_truth)
            results.append(entry)
            print(
                f"Sample {idx + 1}/{len(samples)} | "
                f"Sahara WER {entry['sahara_wer']:.2f} CER {entry['sahara_cer']:.2f} | "
                f"Whisper WER {entry['whisper_wer']:.2f} | Gemini WER {entry['gemini_wer']:.2f}"
            )

    df = pd.DataFrame(results)
    df.to_csv(RESULTS_CSV, index=False)
    print(f"\nBenchmark complete! Results saved to {RESULTS_CSV}")

    print("\n--- Summary Performance ---")
    for name, prefix in [("Sahara v2.5", "sahara"), ("Whisper-v3", "whisper"), ("Gemini", "gemini")]:
        print(
            f"{name:<12} - Mean WER: {df[f'{prefix}_wer'].mean():.4f} | "
            f"Mean CER: {df[f'{prefix}_cer'].mean():.4f} | Mean PIER: {df[f'{prefix}_pier'].mean():.4f}"
        )
    print(f"Intent extraction accuracy: {df['intent_accuracy'].mean() * 100:.1f}%")

    write_report(df, mode, len(results))


if __name__ == "__main__":
    asyncio.run(run_benchmark(sample_size=25))
