# AreaHustle Voice Benchmark

Everything here runs **on Google Colab** — nothing runs locally. The pipeline measures how well three speech-to-text models handle **Nigerian Pidgin-English code-switching** (e.g. *"Abeg I dey Ikeja underbridge now, my brake dey sound, I need mechanic for 5k"*), and whether the transcripts are good enough for Gemini to correctly extract the task slots (`category`, `location`, `budget_ngn`) that AreaHustle's database needs.

## The Files

| File | What it is | What it does |
|---|---|---|
| `AreaHustle_Benchmark_Colab.ipynb` | **The entire pipeline** | Upload this single notebook to [colab.research.google.com](https://colab.research.google.com), enable a T4 GPU runtime, and run top to bottom. It converts your raw phone recordings, runs all three models, computes every metric, prints the two results tables, and downloads `results.json`. |
| `dataset.json` | The answer key | Ground-truth metadata for all 20 samples: the exact Pidgin script for each clip plus the target slots (trade, location, budget). The notebook embeds the same data — this file is the repo's source of truth. **If you edit one, mirror the change in the other.** |
| `validate_notebook.py` | The checker | Verifies the notebook is valid Jupyter JSON and every code cell parses. Run it after any manual edit to the `.ipynb`. |
| `README.md` | This guide | — |

Artifacts you bring back from Colab (`results.json`, zipped audio) are ignored by git — don't commit them; the repo only needs the notebook, the dataset, and the final `BENCHMARK.md` report.

**The recordings are deliberately NOT committed** — they are friends' voices, so `benchmarks/audio/` and `audio.zip` are gitignored. The benchmark is fully reproducible for anyone you privately share the audio with; the public repo carries the notebook, ground-truth dataset, and results instead.

## The Three Models

| Model | Role | How it runs |
|---|---|---|
| **Intron Sahara v2.5** | The production model AreaHustle uses | Live API call (needs `SAHARA_API_KEY`) |
| **OpenAI Whisper Large-v3** | Global multilingual baseline | Colab GPU, Hugging Face `transformers` |
| **Meta MMS-1B** | Open-source baseline | Colab GPU, `facebook/mms-1b-all` |

## How to Run (Step by Step)

1. **Record 20 clips** — read the 20 scripts from `dataset.json` aloud (natural Pidgin, phone voice recorder is fine). Name the files so they sort alphabetically in script order, e.g. `note01.m4a` … `note20.m4a`.
2. **Open the notebook on Colab** — File → Upload notebook → select `AreaHustle_Benchmark_Colab.ipynb`.
3. **Runtime → Change runtime type → T4 GPU.**
4. Run the **Setup** cell, then create a `raw_audio` folder in Colab's file browser and **upload your 20 recordings** into it.
5. Run the remaining cells in order. When the preprocessing cell prints the file→sample mapping, **verify it's correct** before continuing.
6. Enter your `SAHARA_API_KEY` and `GEMINI_API_KEY` when prompted (hidden input; nothing is saved in the notebook).
7. Wait for the three model cells + scoring cells to finish (~15–30 min total). The last cell prints the two tables and downloads `results.json`.

## What Comes Back

- **`results.json`** — every transcript, slot prediction, and score, per model per sample.
- **Two markdown tables** printed in the final cell — paste them (and the real numbers) into `../BENCHMARK.md`, which is the template for the 3-page evaluation PDF.

## The Two Tiers of Scoring

1. **Acoustic (WER + CER)** — transcription fidelity against ground truth, computed with `jiwer` after normalization (lowercase, punctuation stripped, whitespace collapsed).
2. **Downstream slot-filling** — each model's transcripts go through the *same* Gemini extraction prompt; a sample only counts as **end-to-end success** when all three slots (category, location, budget) match the targets.

## Notes & Gotchas

- **Alphabetical mapping is the fragile part.** `note1.m4a, note10.m4a, note2.m4a…` sorts wrong — zero-pad (`note01` … `note20`).
- Sahara sometimes replies "language not available, wait 30 seconds" while the `pcm` model loads — the notebook auto-retries up to 3 times.
- Whisper large-v3 downloads ~3 GB on first load in Colab; that's normal.
- If the MMS `pcm` adapter is unavailable, the notebook falls back to `eng` and records it in `results.json`.
