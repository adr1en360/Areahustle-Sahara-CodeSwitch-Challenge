# Backend Workspace Context

## What This Workspace Is For
The `Backend/` workspace houses the FastAPI application powering AreaHustle. Its primary responsibility is receiving raw spoken audio clips (Nigerian Pidgin `pcm` / Yoruba `yo`), querying the Intron Sahara Voice STT API, extracting structured task and search parameters via Google Gemini, and managing persistence, matching, and escrow status transitions in MongoDB.

## Process
1. **Audio Ingestion**: Receive multipart audio file uploads (`.wav`, `.webm`, `.ogg`) from client endpoints.
2. **Speech-to-Text (Intron Sahara)**: Send audio to `https://infer.voice.intron.io/file/v1/upload/sync` with Bearer auth and specified language code (`pcm` default).
3. **Entity & Intent Extraction (Gemini)**: Pass transcription to Google Gemini with Pydantic JSON schemas to extract structured marketplace parameters (`title`, `category`, `budget`, `neighbourhood`, `description`).
4. **Marketplace & Database Operations**: Insert jobs, query open gigs with filters, transition task states (`open` -> `matched` -> `in_progress` -> `completed`), and record transactions.
5. **Model Benchmarking**: Run the Colab notebook in `../benchmarks/` comparing Sahara against OpenAI Whisper Large-v3 and Meta MMS-1B on WER, CER, and downstream slot-filling accuracy.

## Files In Here
- `main.py`: FastAPI application entrypoint, CORS configuration, and router aggregation.
- `database.py`: Async Motor connection client to MongoDB database `areahustle_fintech`.
- `services/sahara_client.py`: Client for Intron Voice STT upload endpoint with audio pre-processing.
- `services/gemini_extractor.py`: Structured Pydantic extractor using Google Gemini for marketplace intent.
- `routes/voice.py`: `/api/voice/transcribe` and `/api/voice/search` audio processing endpoints.
- `routes/tasks.py`: Task CRUD, price negotiation, match, activate, and complete endpoints.
- `routes/auth.py`, `passport.py`, `transactions.py`, `users.py`: Supporting user, wallet, and passport routes.
- `agents/`: Legacy Twilio/telephony agents (unmounted in `main.py` to prevent carrier demo failure).
- `tests/check_search_query.py`: Verifies the voice-search Mongo query construction (category/location/budget/keyword clauses) without hitting any API.
- `tests/test_gemini_extraction.py`: Standalone Gemini extraction demo script (not part of the server).

## What Good Output Looks Like
- Clean asynchronous route handlers with explicit Pydantic response models.
- Fast execution on Sahara STT synchronous upload (under 3s response time for 10s audio clips).
- Reliable extraction of Lagos locations (e.g. Lekki, Yaba, Ikeja) and Nigerian Naira currency amounts from Pidgin speech.
- Zero reliance on external carrier telephony or unstable webhook tunnels during evaluation.

## Constraints
- **STT-Only Pipeline**: Audio input -> Sahara STT -> Gemini extraction -> visual UI settlement. Do NOT implement TTS voice return (avoids extra TTS benchmarking burden).
- **Environment Variables Only**: All keys (`SAHARA_API_KEY`, `GEMINI_API_KEY`, `MONGO_URI`) must be read from `.env` via `python-dotenv`. Never hardcode API keys or models.
- **Max Audio Length**: Sahara sync upload endpoint accepts a maximum of 120s of audio per file.

_Last updated: 2026-09-14_
