# AreaHustle — Sahara CodeSwitch Africa Challenge

## Identity
AreaHustle is a voice-first gig economy & escrow marketplace built for informal artisans across Lagos, Nigeria. Powered by Intron Sahara Voice STT (`pcm`/`yo`) and Google Gemini structured extraction, it turns natural code-switched voice notes into verified jobs and financial identity.

## Folder Map

| Workspace | Purpose |
|-----------|---------|
| `Backend/` | FastAPI REST API, Sahara STT sync client, Gemini extraction service, MongoDB persistence, offline benchmark runner |
| `Frontend/` | Next.js 16 app with customer dashboard, hustler job feed, voice terminal, and financial passport (handled by frontend dev) |
| `docs/` | System architecture, complete user stories, job lifecycle, frontend handoff specs, and competition design rationales |

## Routing Table

| Task | Go To | Read | Tools/Skills |
|------|-------|------|--------------|
| Understand product context & user stories | `docs/` | `USER_STORY.md` | — |
| Understand system architecture & API schemas | `docs/` | `ARCHITECTURE.md` | — |
| Frontend developer integration & contract | `docs/` | `FRONTEND_HANDOFF.md` | — |
| Backend service logic (Sahara/Gemini/DB) | `Backend/` | `CONTEXT.md` | — |
| Frontend UI components & pages | `Frontend/` | `CONTEXT.md` | — |
| Benchmark evaluation (WER/CER vs Whisper) | `Backend/tests/` | `BENCHMARK.md` | `benchmark_runner.py` |
| Competition submission & compliance | `./` | `README.md`, `RESPONSIBLE_AI.md` | — |

## Naming Conventions
- Voice Audio Samples: `<dialect>_<intent>_<index>.wav` (e.g. `pcm_gen_repair_01.wav`)
- Backend Services: `<service_name>_client.py` or `<service_name>_extractor.py`
- Route Handlers: `Backend/routes/<resource>.py`
- Documentation Specs: `docs/<FEATURE_NAME>.md`
