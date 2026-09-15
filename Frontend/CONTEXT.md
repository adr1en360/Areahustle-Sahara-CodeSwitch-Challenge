# Frontend Workspace Context

## What This Workspace Is For
The `Frontend/` workspace contains the Next.js 16 (App Router) client application for AreaHustle. It provides the visual and audio interface for customers to post tasks via voice, review structured escrow contracts, and for hustlers to browse open jobs, negotiate pricing, activate tasks, and track their Financial Passport.

## Process
1. **Customer Voice Posting (`/Post-Task`)**: Captures microphone audio using the browser MediaRecorder API, submits multipart form data to the backend voice pipeline, renders extracted entities for confirmation, and allows locking escrow.
2. **Customer Dashboard (`/Customer-Dashboard`)**: Displays wallet balance, active posted jobs, price offers from hustlers, job status progression, and escrow release controls.
3. **Hustler Job Feed (`/Jobs`)**: Fetches open marketplace gigs, provides keyword/location filters, handles job acceptance (`/match`), activation (`/activate`), and job completion (`/complete`).
4. **Hustler Passport (`/Passport`)**: Visualizes artisan creditworthiness, trust score (e.g. 820), completed jobs tally, repeat client percentage, and verification badge.

## Files In Here
- `app/Post-Task/page.tsx`: Full customer voice recording terminal, waveform animation, and task submission.
- `app/Jobs/page.tsx`: Hustler marketplace feed, filter controls, job modals, and floating mic button.
- `app/Customer-Dashboard/page.tsx`: Customer dashboard with wallet, active tasks, and payment release triggers.
- `app/Passport/page.tsx`: Financial Passport displaying creditworthiness metrics for informal workers.
- `src/components/VoiceTerminal.tsx`: Quick floating voice terminal widget.
- `src/lib/api.ts`: Centralized fetch wrapper for backend REST API endpoints.
- `src/lib/auth-context.tsx`: Authentication and demo session state provider.

## What Good Output Looks Like
- High aesthetic standard: smooth animations, modern typography, responsive dark/light elements.
- Clean separation between voice capture logic and backend API communication.
- Direct alignment with the API contract documented in `docs/FRONTEND_HANDOFF.md`.

## Constraints
- **Do Not Modify Frontend During Backend Rebuild**: The backend rebuild focuses on server-side implementation and documentation. Frontend integration points are handed off via `docs/FRONTEND_HANDOFF.md`.
- **MediaRecorder Mime Types**: Chrome defaults to `audio/webm;codecs=opus`, Safari to `audio/mp4`. The backend handles format conversion to ensure compatibility with Sahara STT.

_Last updated: 2026-09-14_
