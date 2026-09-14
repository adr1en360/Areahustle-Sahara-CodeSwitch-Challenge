# Docs Workspace Context

## What This Workspace Is For
The `docs/` workspace serves as the authoritative single source of truth for AreaHustle's architectural decisions, user journeys, API specifications, and competition requirements for the Sahara CodeSwitch Africa Challenge. It ensures seamless agent context resumption across sessions and provides clear handoff contracts.

## Process
1. **Context Ingestion**: Any agent or developer joining the project reads `docs/USER_STORY.md` first to understand product intent, competition scope, and non-negotiables.
2. **Architecture Reference**: Developers consult `docs/ARCHITECTURE.md` for endpoint schemas, sequence flows, and state machine definitions.
3. **Frontend Coordination**: Frontend engineers use `docs/FRONTEND_HANDOFF.md` for endpoint contracts, expected payloads, and UI connection steps.

- `USER_STORY.md`: Exhaustive narrative capturing user pain points, personas, end-to-end user stories, competition strategy, what is in/out of scope, and rationale behind all technical decisions.
- `ARCHITECTURE.md`: Complete system design, data flow diagrams, REST endpoint schemas, Sahara Voice integration specs, and task lifecycle state transitions.
- `SAHARA_API_REFERENCE.md`: Authoritative technical reference for the Intron Sahara Voice STT API (endpoints, field names, response JSON, language codes, and formats).
- `SUBMISSION_AND_OPERATIONAL_GUIDE.md`: Operational safeguards (30s cold-start retry, PyAV normalization, dual phone mapping, localhost base URL) and submission form answers (Question 7 250-word architecture tradeoffs, downstream task performance table, access code trap).
- `FRONTEND_HANDOFF.md`: Explicit integration instructions for the frontend developer, listing new and existing endpoints, expected multipart headers, and response formats.

## What Good Output Looks Like
- Zero ambiguity: all API contracts list exact JSON field names, types, and error formats.
- High durability: context remains clear even if agent sessions or chat history are wiped.
- Alignment with the hackathon judging criteria (Track 5: High-Impact Uses, Code-switching STT accuracy, commercial viability).

_Last updated: 2026-09-14_
