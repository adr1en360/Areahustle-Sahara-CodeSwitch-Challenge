# AreaHustle — Voice-First Gig Economy & Financial Identity for Africa

> **Sahara CodeSwitch Africa Challenge (Phase 2)**  
> **Track**: Track 5 — Other High-Impact Uses (Economic Inclusion, Informal Workforce Fintech)  
> **Powered by**: Intron Sahara Voice STT (`pcm` / `yo`) & Google Gemini Structured Extraction

---

## 🌟 Overview

In African megacities like Lagos, over 80% of urban employment lives in the informal economy. Millions of skilled mechanics, carpenters, plumbers, and technicians earn their living daily, yet remain excluded from digital marketplaces and formal credit systems. Why? Because existing platforms demand tedious typing in standard English, while commerce actually happens through rapid, oral **code-switched speech** (Nigerian Pidgin, Yoruba, and English).

**AreaHustle** transforms how informal African labor connects with opportunity:
1. **Voice Task Posting**: A customer speaks their need in colloquial Nigerian Pidgin (*"Abeg I need person wey go fix my generator for Lekki Phase 1, budget na 10k"*).
2. **Sahara Speech-to-Text**: Intron's Sahara Voice API transcribes the code-switched audio with native boundary precision.
3. **Gemini Intent Extraction**: Google Gemini structures the messy conversational transcript into typed marketplace schemas (Category, Title, Budget in NGN, Lagos Neighbourhood, Description).
4. **Escrow Settlement Rail**: Funds are secured in escrow before dispatch, eliminating trust deficits.
5. **Financial Passport**: Every completed gig automatically builds a verifiable proof-of-work credit score, helping informal workers graduate into formal financial access.

---

## 🏗️ Architecture

```
[ Customer Speaks Pidgin ] ──────────► [ Browser MediaRecorder ]
                                                  │ (WAV / WebM)
                                                  ▼
                                       [ POST /api/voice/transcribe ]
                                                  │
                ┌─────────────────────────────────┴─────────────────────────────────┐
                ▼                                                                   ▼
    [ Intron Sahara Voice API ]                                            [ Google Gemini ]
    (CodeSwitch STT: pcm / yo)                                            (Structured Intent Extractor)
                │                                                                   │
                └───► Transcript: "I need mechanic for Lekki..." ───────────────────┘
                                                  │
                                                  ▼
                                     [ Parsed JSON Entities ]
                                 (Budget: 10000, Area: Lekki Phase 1)
                                                  │
                                                  ▼
                                     [ MongoDB: Status "open" ]
                                                  │
                                                  ▼
                                 [ Published to Hustler Network ]
```

---

## 🚀 Key Features

- **🎙️ Code-Switch Aware Voice Engine**: Tailored for Nigerian Pidgin (`pcm`) and Yoruba-English (`yo`), preserving local idioms, slang, and phonetic nuances that global STT engines corrupt.
- **🔍 Hustler Voice Search**: Artisans with busy hands or in loud environments can tap a mic and speak queries (*"Any plumbing work for Yaba?"*) to filter nearby gigs dynamically.
- **🔒 Zero-Risk Escrow**: Eliminates fraud. Customers lock payment into escrow upon posting; payment is automatically released when the customer inspects and verifies the completed job.
- **📈 Financial Passport**: Translates daily manual hustle into institutional creditworthiness (Trust Score, completion rates, repeat client metrics).
- **📊 Multi-Model Offline Benchmark**: Evaluation notebook (Google Colab) comparing Intron Sahara against OpenAI Whisper Large-v3 and Meta MMS-1B on African code-switched audio.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.11+, FastAPI, Motor (Async MongoDB Driver), Pydantic v2
- **Voice AI**: Intron Health Sahara Voice API (`/file/v1/upload/sync`)
- **LLM**: Google Gemini (`gemini-3.5-flash-lite` / configurable via `GEMINI_MODEL`)
- **Database**: MongoDB Atlas (`areahustle_fintech`)
- **Audio Pre-processing**: `pydub`, `soundfile`
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons

---

## ⚡ Quick Start (Backend)

### 1. Prerequisites
- Python 3.10+
- MongoDB instance (local or MongoDB Atlas)
- Intron Sahara Voice API Key ([voice.intron.io](https://voice.intron.io))
- Google AI Studio Gemini API Key ([aistudio.google.com](https://aistudio.google.com))

### 2. Setup Environment
```bash
cd Backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure `.env`
Copy the template and fill in your keys:
```bash
cp .env.example .env
```
Edit `.env`:
```env
SAHARA_API_KEY=your_intron_sahara_api_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=areahustle_fintech
```

### 4. Run Server
```bash
uvicorn main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

---

## 🧪 Benchmark Evaluation

We evaluated Intron Sahara Voice against OpenAI Whisper Large-v3 and Meta MMS-1B on 20 self-recorded Nigerian Pidgin code-switched clips, measuring WER/CER plus downstream Gemini slot-filling accuracy.

The benchmark runs entirely on Google Colab:
```bash
# locally, only the two prep helpers run:
cd benchmarks
python convert_audio.py     # standardize recordings to 16kHz mono WAV
python compress_audio.py    # validate + zip for upload
```
Then upload `benchmarks/AreaHustle_Benchmark_Colab.ipynb` to [Google Colab](https://colab.research.google.com) with a T4 GPU runtime, drag `audio.zip` into `/content`, and run top to bottom. See [`benchmarks/README.md`](benchmarks/README.md) for the full workflow.

See [BENCHMARK.md](BENCHMARK.md) for full methodology, WER/CER tables, and qualitative analysis.

---

## 🛡️ Responsible AI

AreaHustle was developed with strict ethical and data privacy principles:
- **Zero Background Listening**: Audio recording is strictly opt-in, activated only by physical user click.
- **In-Memory Audio Processing**: Voice notes are processed in volatile memory and discarded immediately after transcription; no raw voice data is stored on disk or shared with third parties.
- **Data Minimization**: Personal identifiable information (PII) like phone numbers are held in escrow and revealed only upon mutual job match.

See [RESPONSIBLE_AI.md](RESPONSIBLE_AI.md) for our full compliance statement.

---

## 📖 Project Documentation Directory

- [`docs/USER_STORY.md`](docs/USER_STORY.md): Complete user personas, journeys, decisions, and product context.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Deep-dive system architecture, sequence diagrams, and API schemas.
- [`docs/FRONTEND_HANDOFF.md`](docs/FRONTEND_HANDOFF.md): Endpoint contracts and integration guide for frontend engineers.
- [`AGENT.md`](AGENT.md): Routing map for autonomous AI agents.
