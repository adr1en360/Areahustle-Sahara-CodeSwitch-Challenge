import os
import io
import re
import asyncio
import pandas as pd
import soundfile as sf
import jiwer
import httpx
from datasets import load_dataset
from openai import AsyncOpenAI
from google import genai

# API Clients & Credentials
SAHARA_API_KEY = os.getenv("SAHARA_API_KEY")
SAHARA_ENDPOINT = "https://infer.voice.intron.io/file/v1/upload"
whisper_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Text normalization for fair comparison
def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    return re.sub(r"\s+", " ", text).strip()

def extract_code_switched_spans(tagged_text: str) -> str:
    """Extracts words inside [[EN]] ... [[/EN]] tags for Point-of-Interest evaluation."""
    matches = re.findall(r"\[\[EN\]\](.*?)\[\[/EN\]\]", tagged_text, flags=re.IGNORECASE)
    extracted = " ".join(matches)
    return normalize_text(extracted)

# Model Transcription Calls
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
            model="whisper-1", # Maps to Whisper large-v3 API
            file=audio_file
        )
        return transcription.text
    except Exception as e:
        return f"[WHISPER ERROR: {str(e)}]"

async def transcribe_gemini(audio_bytes: bytes) -> str:
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                "Transcribe this audio verbatim. Capture the exact spoken Nigerian Pidgin and English words without translating.",
                genai.types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav")
            ]
        )
        return response.text or ""
    except Exception as e:
        return f"[GEMINI ERROR: {str(e)}]"

# Benchmark Pipeline
async def run_benchmark(sample_size: int = 25):
    print(f"Loading AfriSwitch dataset from Hugging Face...")
    # Load Nigerian Pidgin / English code-switching subset
    ds = load_dataset("intronhealth/AfriSwitch", split="test", streaming=True)
    
    results = []
    async with httpx.AsyncClient() as http_client:
        for idx, item in enumerate(ds):
            if idx >= sample_size:
                break

            # Decode audio array to WAV bytes
            audio_data = item["audio"]["array"]
            sr = item["audio"]["sampling_rate"]
            buffer = io.BytesIO()
            sf.write(buffer, audio_data, sr, format="WAV")
            wav_bytes = buffer.getvalue()

            ground_truth = item.get("transcription", "")
            tagged_ground_truth = item.get("transcription_tagged", "")
            poi_truth = extract_code_switched_spans(tagged_ground_truth)
            cmi = item.get("cmi", 0.0)

            # Concurrent API dispatch
            sahara_raw, whisper_raw, gemini_raw = await asyncio.gather(
                transcribe_sahara(http_client, wav_bytes),
                transcribe_whisper(wav_bytes),
                transcribe_gemini(wav_bytes)
            )

            # Normalize for fair WER calculation
            ref = normalize_text(ground_truth)
            s_hyp = normalize_text(sahara_raw)
            w_hyp = normalize_text(whisper_raw)
            g_hyp = normalize_text(gemini_raw)

            # Compute Word Error Rates
            s_wer = jiwer.wer(ref, s_hyp) if ref else 0.0
            w_wer = jiwer.wer(ref, w_hyp) if ref else 0.0
            g_wer = jiwer.wer(ref, g_hyp) if ref else 0.0

            # Compute Point-of-Interest (Code-Switching Boundary) Error Rates
            s_pier = jiwer.wer(poi_truth, s_hyp) if poi_truth else 0.0
            w_pier = jiwer.wer(poi_truth, w_hyp) if poi_truth else 0.0
            g_pier = jiwer.wer(poi_truth, g_hyp) if poi_truth else 0.0

            results.append({
                "sample_id": idx + 1,
                "cmi": cmi,
                "ground_truth": ground_truth,
                "poi_truth": poi_truth,
                "sahara_transcript": sahara_raw,
                "sahara_wer": round(s_wer, 4),
                "sahara_pier": round(s_pier, 4),
                "whisper_transcript": whisper_raw,
                "whisper_wer": round(w_wer, 4),
                "whisper_pier": round(w_pier, 4),
                "gemini_transcript": gemini_raw,
                "gemini_wer": round(g_wer, 4),
                "gemini_pier": round(g_pier, 4),
            })
            print(f"Sample {idx+1}/{sample_size} processed | Sahara WER: {s_wer:.2f} | Whisper WER: {w_wer:.2f} | Gemini WER: {g_wer:.2f}")

    # Export report
    df = pd.DataFrame(results)
    df.to_csv("benchmark_results.csv", index=False)
    print("\nBenchmark complete! Results saved to backend/tests/benchmark_results.csv")
    
    # Summary Metrics
    print("\n--- Summary Performance ---")
    print(f"Sahara v2.5   - Mean WER: {df['sahara_wer'].mean():.4f} | Mean PIER: {df['sahara_pier'].mean():.4f}")
    print(f"Whisper-v3    - Mean WER: {df['whisper_wer'].mean():.4f} | Mean PIER: {df['whisper_pier'].mean():.4f}")
    print(f"Gemini Flash  - Mean WER: {df['gemini_wer'].mean():.4f} | Mean PIER: {df['gemini_pier'].mean():.4f}")

if __name__ == "__main__":
    asyncio.run(run_benchmark(sample_size=25))