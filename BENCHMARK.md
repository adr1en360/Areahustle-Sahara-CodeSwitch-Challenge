# AreaHustle Voice Benchmark Report

> Final results from the completed 20-sample Colab run (`benchmarks/results.json`).
> Export to PDF (3 pages max) and upload to Google Drive with "Anyone with the link can view" permissions.

Evaluation of intra-sentential Nigerian Pidgin-English code-switching for autonomous gig-marketplace transactions. Sahara CodeSwitch Africa Challenge, Track 5.

---

## Page 1: Overview, model tradeoffs, and dataset methodology

### Executive summary

AreaHustle is a voice-first gig marketplace for Lagos informal markets where customers post artisan jobs by speaking Nigerian Pidgin-English. This evaluation measures whether three speech-to-text models can transcribe intra-sentential Pidgin-English code-switching in spontaneous artisan dispatch commands, and whether the resulting transcripts are accurate enough for an LLM agent to autonomously execute the downstream database transaction (trade category, location, budget) without human correction.

### Model overview

| Model | Pros | Cons |
|---|---|---|
| Intron Sahara v2.5 | Retains African language alternation boundaries and regional trade loanwords (e.g. *vulcanizer*, *rewinder*) verbatim; high phonetic precision on non-standard syntax | Commercial API dependency; requires network round-trip |
| OpenAI Whisper Large-v3 | Strong global multilingual coverage; resilient to ambient background noise | Phonetically hallucinates standard English words over Pidgin markers (e.g. turns *"dey"* into *"day"*) |
| Meta MMS-1B | Open-source weights; lightweight inference footprint | Struggles with spontaneous intra-sentential code-switching; high deletion/insertion rates on mixed sentences |

### Dataset specifications

- **Source:** 20 natural artisan dispatch commands recorded for this evaluation (self-recorded; recordings available on request, participant voices are not published in the repo).
- **Language/Dialect:** Nigerian Pidgin-English (`pcm`) with regional trade vocabulary.
- **Sample size and duration:** 20 consented recordings; total 2.8 minutes of audio; average clip length 8.4 seconds.
- **Audio preprocessing:** Normalized to 16,000 Hz, 16-bit PCM, single-channel mono WAV with peak loudness normalization (automated in-notebook via FFmpeg).
- **Ground truth:** Verbatim transcripts and target slots (`category`, `location`, `budget_ngn`) per clip, in `benchmarks/dataset.json`. Samples 01-05 were recorded with natural ad-libbing rather than verbatim script reading; ground-truth transcripts and slot targets were aligned to the actual speech post-hoc.

---

## Page 2: Evaluation metrics and quantitative findings

### Why these metrics

- **WER (Word Error Rate):** Standard benchmark for transcription fidelity.
- **CER (Character Error Rate):** Particularly important for indigenous African terms, where minor character alterations separate intelligible slang from lexical corruption.
- **Downstream Slot-Filling Accuracy (%):** The test that matters most for production: every model's transcripts were passed through the identical Gemini (`gemini-3.5-flash-lite`) extraction prompt and compared against ground-truth target slots.

### Table 1: Acoustic performance (speech-to-text)

| Model | Model Type | Parameters | Dialect | WER (%) | CER (%) |
|---|---|---|---|---|---|
| Intron Sahara v2.5 | Domain-Specific API | Proprietary | `pcm` | **26.6** | **12.9** |
| OpenAI Whisper Large-v3 | General Transformer | 1.55B | English decoding | 59.7 | 24.0 |
| Meta MMS-1B | Multilingual CTC | 1.0B | `pcm` | 75.7 | 31.7 |

### Table 2: Downstream agentic task performance (Gemini slot-filling)

| Model Source Transcript | Trade Category Accuracy (%) | Location Accuracy (%) | Budget Extraction (%) | End-to-End Task Success (%) |
|---|---|---|---|---|
| Intron Sahara v2.5 | **55.0** | **40.0** | **95.0** | **15.0** |
| OpenAI Whisper Large-v3 | 80.0 | 20.0 | 95.0 | 20.0 |
| Meta MMS-1B | 60.0 | 30.0 | 65.0 | 5.0 |

### Quantitative findings

Sahara produces less than half the transcription error of the best global baseline (WER 26.6% vs 59.7% for Whisper and 75.7% for MMS; CER 12.9% vs 24.0% / 31.7%). The advantage is concentrated where AreaHustle needs it: code-switched Pidgin markers and vernacular trade loanwords.

Budget extraction is where acoustic error converts directly into money. Sahara and Whisper both land the escrow amount 95% of the time, while MMS's numeral corruption (3500 becomes "10005 hundred", 9000 becomes 1000, and three clips returned a budget of 0) drops it to 65%.

Whisper posts the highest category accuracy (80% vs Sahara's 55%) despite more than double the WER. Its English-biased output happens to match the target label vocabulary ("carpenter", "electrician"), while Sahara's verbatim Pidgin trade terms ("roof repairer", "refrigerator repairer", "brick layer") fail exact string-match against the ground-truth labels ("Roofer", "Fridge repairer", "Bricklayer"). This is label aliasing, not acoustic failure, and it is what motivated the canonical category-mapping layer now shipping in the production backend.

Location is the weakest slot for every model (Sahara 40%, MMS 30%, Whisper 20%). Yoruba-origin Lagos place names like Ojuelegba, Ilupeju, Ketu, and Agege get phonetically corrupted regardless of model, a failure mode examined in the case study below. Because end-to-end success requires all three slots to match exactly, per-slot accuracies compound into just 15% joint success for Sahara (Whisper 20%, MMS 5%). At n=20 one clip is five percentage points, so the Sahara-Whisper gap is within noise.

---

## Page 3: Qualitative findings and failure-mode analysis

### Strengths and weaknesses per model

**Intron Sahara v2.5**
- Preserved local grammatical particles (*"wey"*, *"fit"*, *"wan"*) and vernacular trade classifications (*"rewinder"*, *"vulcanizer"*), which the downstream parser mapped directly to database fields.
- Struggles on specialist trade loanwords and truncated numerals. Ground truth *"I need rewinder wey go check my pumping machine, my budget na 6k"* came back as *"I need rwanda wey go check my pumping machine my budget na 6"*: "rewinder" became "rwanda" and the budget collapsed from 6,000 to 6.

**OpenAI Whisper Large-v3**
- Standard-English bias causes phonetic hallucination over Pidgin markers. When a location entity is corrupted, the downstream agent fails to geo-route the job.
- Ground truth *"Abeg I dey Ikeja underbridge now, my brake dey sound, I need mechanic for 5k"* came back as *"ID Ikeza under bridge. My break day sound. I need mechanic for 5K."* Every Pidgin marker snapped to its standard-English homophone (*"dey"* became *"day"*, *"brake"* became *"break"*). On sample_11 the same bias produced full pseudo-Yoruba hallucination (*"Wè dà dè dì dì sè wè, a yon gè tì ndòn kòt fò o djù e lèk bà wù"*).

**Meta MMS-1B**
- Systematic character-level respelling of trade terms (*"mekanik"*, *"plonbar"*, *"briklayer"*), run-on word merges (*"lekeifese"* for "Lekki phase 1"), and numeral corruption severe enough that the budget slot returned 0 on three clips. Ground truth *"My kitchen pipe don burst, I need plumber fast fast, I get 5k for hand"* came back as *"my kishing py plone boast i nid plonbar fast-fast i gave five key for hand"*.

### Case study: Language-code sensitivity (`pcm` vs `yo`)

The quantitative tables above use Sahara's `pcm` model exclusively, which is the language AreaHustle runs in production. To understand what that choice trades away, we ran a single representative clip (`sample_11`) through Sahara twice, once per language code. Ground truth: *"Welder dey this area? Iron gate hinge don cut for Ojuelegba, 4500 naira dey."*

| Aspect | Sahara `pcm` | Sahara `yo` |
|---|---|---|
| Transcript | "Welder dey dis area iron gate in don cut for Uju lego 4500 naira dey" | "Well that day this area, I youngate in done court for ojú ẹlẹ́gba o, 400 naira day" |
| Trade + code-switched verbs | ✅ preserved ("Welder dey… don cut") | ❌ collapsed to English ("Well that day… done court") |
| Yoruba-origin place name | ❌ corrupted ("Ojuelegba" became "Uju lego") | ✅ recovered in native orthography ("ojú ẹlẹ́gba") |
| Budget amount | ✅ exact (4500) | ❌ corrupted to 400 |

The two models fail in complementary ways. `pcm` preserves the code-switched Pidgin and, critically for a transaction platform, the budget amount, but phonetically corrupts Yoruba place names. `yo` recovers those place names in native orthography yet wrecks English words and the numeral. A wrong budget silently misprices an escrow contract; a wrong neighbourhood only degrades matching. AreaHustle therefore defaults to `pcm` and exposes `yo` as an explicit user toggle. This asymmetric-failure reasoning is why the quantitative evaluation holds the language code fixed at `pcm` rather than averaging across both.

### Architectural conclusion

Intron Sahara v2.5 halves the transcription error of the best global baseline (WER 26.6% vs 59.7%) and is the only model that preserves code-switched Pidgin markers and trade loanwords verbatim. The remaining failures concentrate in two places: specialist trade-label vocabulary and Yoruba-origin place names. Both are addressed in the production backend by the canonical category-mapping layer and the per-language (`pcm`/`yo`) toggle, not by the ASR model alone. Per-sample transcripts and full metrics are in `benchmarks/results.json`.
