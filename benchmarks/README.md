# AreaHustle voice benchmark

All model inference runs on Google Colab. The three STT models and the scoring never touch your machine; the only things that run locally are two small helper scripts that prepare and zip the recordings. The pipeline measures how well three speech-to-text models handle Nigerian Pidgin-English code-switching (e.g. "Abeg I dey Ikeja underbridge now, my brake dey sound, I need mechanic for 5k"), and whether the transcripts are good enough for Gemini to correctly extract the task slots (`category`, `location`, `budget_ngn`) that AreaHustle's database needs.

## Sample naming

One clip, one name, everywhere. Recording number 11 is `sample_11.wav` in `audio/`, in `dataset.json`, and in the Colab notebook. Friends can send their recordings under any filename as long as it contains the sample number (`Note007.m4a`, `clip 11.wav`); `convert_audio.py` picks out the first number it finds and renames the file to `sample_NN.wav`.

The notebook never reads the number in a filename. It maps uploaded files to samples alphabetically: the first file in sort order becomes `sample_01`, the second `sample_02`, and so on. The zero-padded `sample_NN` names keep file order equal to sample order.

## The files

| File | What it is | What it does |
|---|---|---|
| `AreaHustle_Benchmark_Colab.ipynb` | The entire pipeline | Upload this notebook to [colab.research.google.com](https://colab.research.google.com), enable a T4 GPU runtime, and run top to bottom. It ingests your `audio.zip`, standardizes the recordings, runs all three models, computes every metric, prints the two results tables, and downloads `results.json`. |
| `dataset.json` | The answer key | Ground-truth metadata for all 20 samples: the exact Pidgin script for each clip plus the target slots (trade, location, budget). The notebook embeds the same data, so if you edit one, mirror the change in the other. |
| `convert_audio.py` | Local pre-converter | Standardizes everything in `audio/` to 16 kHz / 16-bit PCM / mono / peak-normalized WAV named `sample_NN.wav`, using the same logic as the notebook so results are identical either way. Replaces the originals. Needs `ffmpeg` on PATH plus `numpy` and `soundfile`. |
| `compress_audio.py` | Local zipper | Checks that there are exactly 20 files and that they sort alphabetically in the intended order, asks for confirmation, then writes `audio.zip` for upload to Colab. |
| `audio/` | The recordings (gitignored) | Real voices, deliberately not committed. Currently holds `sample_01.wav` through `sample_20.wav`. |

The zip and the recordings stay out of the repo. `results.json` is committed: it is a submission requirement and holds no audio. The repo carries the notebook, the ground-truth dataset, the run's `results.json`, and the final `BENCHMARK.md` report; the recordings stay private.

## The three models

| Model | Role | How it runs |
|---|---|---|
| Intron Sahara v2.5 | The production model AreaHustle uses | Live API call (needs `SAHARA_API_KEY`) |
| OpenAI Whisper Large-v3 | Global multilingual baseline | Colab GPU, Hugging Face `transformers` |
| Meta MMS-1B | Open-source baseline | Colab GPU, `facebook/mms-1b-all` |

## How to run

1. Record 20 clips. The lines to read aloud are the `transcript` values in `dataset.json` (natural Pidgin, phone voice recorder is fine). Friends' filenames just need to contain the sample number.
2. Convert locally: `python convert_audio.py`. It prints the conversion table and a format check, and is safe to rerun as more recordings arrive.
3. Zip: `python compress_audio.py`. It verifies the count is 20 and the alphabetical order matches the intended sample order before writing `audio.zip`.
4. Open the notebook on Colab: File > Upload notebook > select `AreaHustle_Benchmark_Colab.ipynb`.
5. Runtime > Change runtime type > T4 GPU.
6. Drag `audio.zip` into the Colab file browser root (`/content`). The ingestion cell extracts it into `raw_audio/` automatically; uploading the 20 loose files into a `raw_audio/` folder also works.
7. Run the remaining cells in order. When the preprocessing cell prints the file-to-sample mapping, check it is correct before continuing.
8. Enter your `SAHARA_API_KEY` and `GEMINI_API_KEY` when prompted (hidden input; nothing is saved in the notebook).
9. Wait for the three model cells and the scoring cells to finish, roughly 15-30 minutes. The last cell prints the two tables and downloads `results.json`.

## Current status

- All 20/20 samples collected and standardized: `sample_01.wav` through `sample_20.wav`, verified at 16 kHz / mono / PCM_16, 5-12 s each.
- Colab run complete: all three models scored on all 20 clips (Sahara `pcm`, Whisper large-v3, MMS-1B `pcm` adapter). Full transcripts and scores are in `results.json`; the numbers are written up in `../BENCHMARK.md`.

## What comes back

- `results.json`: every transcript, slot prediction, and score, per model per sample.
- Two markdown tables printed in the final cell. The real numbers are already in `../BENCHMARK.md`, the source for the 3-page evaluation PDF.

## Two tiers of scoring

1. Acoustic (WER + CER): transcription fidelity against ground truth, computed with `jiwer` after normalization (lowercase, punctuation stripped, whitespace collapsed).
2. Downstream slot-filling: each model's transcripts go through the same Gemini extraction prompt. A sample counts as end-to-end success only when all three slots (category, location, budget) match the targets.

## Notes and gotchas

- Alphabetical mapping is the fragile part if you upload raw, unconverted files straight to Colab: `sample_1`, `sample_10`, `sample_2` sort in the wrong order. Zero-pad (`sample_01` to `sample_20`). Converting locally first avoids this, since `convert_audio.py` always writes zero-padded names.
- Sahara sometimes replies "language not available, wait 30 seconds" while the `pcm` model loads. The notebook auto-retries up to 3 times.
- Whisper large-v3 downloads about 3 GB on first load in Colab; that is normal.
- If the MMS `pcm` adapter is unavailable, the notebook falls back to `eng` and records it in `results.json`.
