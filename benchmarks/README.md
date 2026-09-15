# AreaHustle Voice Benchmark

All model inference runs **on Google Colab** — the three STT models and the scoring never touch your machine. The only things that run locally are two small helper scripts that prepare and zip the recordings. The pipeline measures how well three speech-to-text models handle **Nigerian Pidgin-English code-switching** (e.g. *"Abeg I dey Ikeja underbridge now, my brake dey sound, I need mechanic for 5k"*), and whether the transcripts are good enough for Gemini to correctly extract the task slots (`category`, `location`, `budget_ngn`) that AreaHustle's database needs.

## The Files

| File | What it is | What it does |
|---|---|---|
| `AreaHustle_Benchmark_Colab.ipynb` | **The entire pipeline** | Upload this single notebook to [colab.research.google.com](https://colab.research.google.com), enable a T4 GPU runtime, and run top to bottom. It ingests your `audio.zip`, standardizes the recordings, runs all three models, computes every metric, prints the two results tables, and downloads `results.json`. |
| `dataset.json` | The answer key | Ground-truth metadata for all 20 samples: the exact Pidgin script for each clip plus the target slots (trade, location, budget). The notebook embeds the same data — this file is the repo's source of truth. **If you edit one, mirror the change in the other.** |
| `RECORDING_INSTRUCTIONS.md` | The script for your friends | The 20 lines to read aloud, the naming rule (`note01` … `note20`), and recording tips. Send this file to whoever is recording. |
| `convert_audio.py` | Local pre-converter | One-time: standardizes everything in `audio/` to 16 kHz / 16-bit PCM / mono / peak-normalized WAV named `noteNN.wav` (same logic as the notebook, so results are identical either way). Replaces the originals. Needs `ffmpeg` on PATH plus `numpy` and `soundfile`. |
| `compress_audio.py` | Local zipper | Validates there are exactly 20 files and that they sort alphabetically in the intended order, asks for confirmation, then writes `audio.zip` for upload to Colab. |
| `validate_notebook.py` | The checker | Verifies the notebook is valid Jupyter JSON and every code cell parses. Run it after any manual edit to the `.ipynb`. |
| `audio/` | The recordings (gitignored) | Friends' voices — deliberately not committed. Currently holds the converted `note11.wav` – `note20.wav`; `note01` – `note10` are still being collected. |
| `README.md` | This guide | — |

Artifacts you bring back from Colab (`results.json`, zipped audio) are ignored by git — don't commit them; the repo only needs the notebook, the dataset, and the final `BENCHMARK.md` report.

## The Three Models

| Model | Role | How it runs |
|---|---|---|
| **Intron Sahara v2.5** | The production model AreaHustle uses | Live API call (needs `SAHARA_API_KEY`) |
| **OpenAI Whisper Large-v3** | Global multilingual baseline | Colab GPU, Hugging Face `transformers` |
| **Meta MMS-1B** | Open-source baseline | Colab GPU, `facebook/mms-1b-all` |

## How to Run (Step by Step)

1. **Record 20 clips** — send `RECORDING_INSTRUCTIONS.md` to your friends; each reads their lines and sends back the file. Drop everything into `benchmarks/audio/` (any phone format: `.m4a`, `.mp3`, `.wav`, `.amr`, `.3gp`, `.mp4` …). The number in the filename decides the sample: `note03` → `sample_03`.
2. **Convert locally** — `python convert_audio.py`. Prints the conversion table and the final format check. Run it again later when the remaining recordings arrive — it's safe to rerun on whatever is in the folder.
3. **Zip** — `python compress_audio.py`. Verifies the count is 20 and the alphabetical order is the intended sample order before writing `audio.zip`.
4. **Open the notebook on Colab** — File → Upload notebook → select `AreaHustle_Benchmark_Colab.ipynb`.
5. **Runtime → Change runtime type → T4 GPU.**
6. **Drag `audio.zip` into the Colab file browser root (`/content`)** — the ingestion cell extracts it into `raw_audio/` automatically (uploading the 20 loose files into a `raw_audio/` folder also works).
7. Run the remaining cells in order. When the preprocessing cell prints the file→sample mapping, **verify it's correct** before continuing.
8. Enter your `SAHARA_API_KEY` and `GEMINI_API_KEY` when prompted (hidden input; nothing is saved in the notebook).
9. Wait for the three model cells + scoring cells to finish (~15–30 min total). The last cell prints the two tables and downloads `results.json`.

## Current Status

- ✅ Samples 11–20 recorded, converted, and format-verified (16 kHz / mono / PCM_16, 6–12 s each) in `audio/`.
- ⏳ Samples 01–10 awaiting friends' recordings → then rerun `convert_audio.py` and `compress_audio.py`.

## What Comes Back

- **`results.json`** — every transcript, slot prediction, and score, per model per sample.
- **Two markdown tables** printed in the final cell — paste them (and the real numbers) into `../BENCHMARK.md`, which is the template for the 3-page evaluation PDF.

## The Two Tiers of Scoring

1. **Acoustic (WER + CER)** — transcription fidelity against ground truth, computed with `jiwer` after normalization (lowercase, punctuation stripped, whitespace collapsed).
2. **Downstream slot-filling** — each model's transcripts go through the *same* Gemini extraction prompt; a sample only counts as **end-to-end success** when all three slots (category, location, budget) match the targets.

## Notes & Gotchas

- **Alphabetical mapping is the fragile part.** `note1.m4a, note10.m4a, note2.m4a…` sorts wrong — zero-pad (`note01` … `note20`). `convert_audio.py` enforces the zero-padded `noteNN.wav` names for you.
- Sahara sometimes replies "language not available, wait 30 seconds" while the `pcm` model loads — the notebook auto-retries up to 3 times.
- Whisper large-v3 downloads ~3 GB on first load in Colab; that's normal.
- If the MMS `pcm` adapter is unavailable, the notebook falls back to `eng` and records it in `results.json`.
