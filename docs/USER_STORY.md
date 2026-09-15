# AreaHustle — Comprehensive User Story & Product Context

## 1. Executive Summary & Vision

**AreaHustle** is an AI-powered, voice-first marketplace and financial escrow platform tailored specifically for the informal economy of Lagos, Nigeria. 

In African megacities like Lagos, millions of skilled artisans, technicians, and manual laborers ("hustlers"—carpenters, generator mechanics, plumbers, electricians, dispatch riders) earn their living daily. However, existing digital platforms fail them because:
1. **Typing and Literacy Barriers**: Filling out multi-step web forms on mobile screens is cumbersome, unnatural, and alienating for artisans who operate primarily through oral communication.
2. **Code-Switching Realities**: In everyday commerce, Nigerians rarely speak pure Standard English. They seamlessly blend **Nigerian Pidgin ("Pidgin")**, **Yoruba**, **Igbo**, and **Hausa** into English (e.g., *"I need person wey go help me fix my generator for Lekki Phase 1, my budget na 8 thousand naira"*). Global voice assistants (Siri, Alexa, Google STT, OpenAI Whisper) fail dramatically on these accents and code-switched vocabularies.
3. **The Informal Trust Deficit**: Customers fear being scammed or dealing with substandard work; hustlers fear doing honest work and not receiving payment.
4. **Lack of Financial Identity**: Because informal jobs are paid in ad-hoc cash or direct bank transfers, artisans remain "credit invisible"—unable to qualify for micro-loans, equipment leasing, or formal banking products despite generating consistent revenue.

**AreaHustle solves this by pairing Intron Health's Sahara CodeSwitch Speech-to-Text API with Google Gemini structured entity extraction, an escrow payment rail, and an automated Financial Passport.**

---

## 2. Sahara CodeSwitch Challenge Context

- **Hackathon**: Sahara CodeSwitch Africa Challenge (Phase 2 Main Challenge).
- **Core Requirement**: Build an AI voice application that genuinely understands speech and takes concrete action (booking, creating records, matching), rather than merely printing text on screen.
- **Track Targeted**: **Track 5 — Other High-Impact Uses** (Economic Empowerment, Inclusive Commerce & Informal Workforce Fintech).
- **Key Deliverables Required**:
  1. Functional application demonstrating voice-driven actions.
  2. Multi-model benchmark report comparing Intron Sahara Voice against at least two alternative STT models (e.g. OpenAI Whisper, Meta MMS/Gemini) on code-switched African speech.
  3. Responsible AI statement detailing privacy, consent, and voice data handling.
  4. Video demonstration and technical walkthrough.

---

## 3. User Personas

### Persona A: The Customer (e.g., Chioma, Busy Professional in Lekki)
- **Context**: Working from home when her power generator breaks down.
- **Pain Point**: She needs a reputable technician right now. She doesn't want to type out a lengthy service request form with drop-down menus while dealing with an emergency.
- **Behavior**: She opens AreaHustle on her mobile browser, presses the microphone button, and naturally speaks her request in Lagos street vernacular: *"Abeg I need mechanic wey go service my Tiger gen today-today for Lekki Phase 1, budget na 10k."*
- **Desired Outcome**: The app instantly understands her speech, extracts the category (Generator Repair), budget (₦10,000), location (Lekki Phase 1), locks her escrow payment securely, and broadcasts the job to vetted hustlers nearby.

### Persona B: The Hustler (e.g., Babatunde, Certified Generator & Electrical Artisan)
- **Context**: In his workshop or in transit with tools in hand.
- **Pain Point**: Cannot type while working with greasy hands or navigating traffic. Needs to discover jobs in his immediate neighborhood without navigating dense menus. Also needs to prove his earnings history to acquire a bank loan for a new diagnostic meter.
- **Behavior**: Opens AreaHustle, taps the voice search mic, and says: *"Show me all generator work wey dey Lekki or Ajah."* He reviews the filtered gigs, accepts with one click, completes the work, receives immediate escrow release, and sees his Financial Passport Trust Score climb.
- **Desired Outcome**: Immediate job discovery, guaranteed payment in escrow, and an immutable proof-of-work reputation score.

---

## 4. End-to-End User Stories & Lifecycle

### Story 1: Customer Voice Task Creation
```
As a Customer,
I want to speak my service need in Nigerian Pidgin or Yoruba-English,
So that I can post a detailed job without manually typing complex forms.
```
1. Customer visits the task creation terminal.
2. Taps the microphone to record a voice note (5–30 seconds).
3. The browser records clean audio (WAV/PCM or WebM) and submits it to `POST /api/voice/transcribe`.
4. The backend calls **Intron Sahara Voice STT** with language code `pcm` (Nigerian Pidgin) or `yo` (Yoruba).
5. Sahara returns the exact code-switched transcript.
6. The backend feeds this transcript into **Google Gemini** with a strict Pydantic schema (`TaskIntent`).
7. Gemini extracts:
   - `title`: "Generator Servicing & Repair"
   - `category`: "Repairs / Mechanical"
   - `budget`: 10000.0
   - `neighbourhood`: "Lekki Phase 1"
   - `description`: "Customer needs someone to service a Tiger generator today in Lekki Phase 1."
8. The customer sees these fields pre-filled in a confirmation card.
9. With one tap ("Lock Escrow"), the job is persisted to MongoDB (`status: "open"`) and published to the hustler network.

---

### Story 2: Hustler Voice Job Discovery & Search
```
As a Hustler,
I want to speak search queries into the marketplace,
So that I can quickly find jobs matching my skills and territory without typing.
```
1. Hustler opens the marketplace feed (`/Jobs`).
2. Taps the floating voice search button and speaks: *"Any plumbing or electrical job wey dey Yaba under twenty thousand?"*
3. Audio is transmitted to `POST /api/voice/search`.
4. Sahara transcribes the speech; Gemini extracts the search parameters (`category: "Plumbing"`, `location: "Yaba"`, `budget_max: 20000`).
5. The backend executes a MongoDB query against active tasks and returns matching gigs.
6. The job feed dynamically refreshes with the results.

---

### Story 3: Negotiation & Job Acceptance
```
As a Hustler,
I want to review task details and either accept at the customer's budget or propose a counter-offer,
So that pricing is transparent and fair before travel.
```
1. Hustler views the task description, location, and listed payout.
2. The hustler can either accept directly (`POST /api/tasks/{id}/match`) or propose a counter-offer amount.
3. Once accepted, task status transitions to `matched`. The customer and hustler unlock each other's contact details (phone / WhatsApp) to coordinate arrival.

---

### Story 4: Execution & Escrow Settlement
```
As both Customer and Hustler,
We want funds locked in escrow until work is completed,
So that payment is 100% guaranteed upon job verification.
```
1. When the hustler arrives on site, he taps "Start Job" (`POST /api/tasks/{id}/activate` -> `status: "in_progress"`).
2. Upon completing the repair, the hustler taps "Mark as Done".
3. The customer receives a prompt on her dashboard: *"Hustler has marked the job as done. Please inspect and release payment."*
4. The customer inspects the generator, confirms satisfaction, and taps **"Release Payment"** (`POST /api/tasks/{id}/complete` -> `status: "completed"`).
5. Escrow funds are transferred to the hustler's wallet balance.

---

### Story 5: Automated Financial Passport Accumulation
```
As a Hustler,
I want my completed jobs and customer ratings to build a portable financial record,
So that I can prove my creditworthiness to financial institutions.
```
1. Each completed task automatically logs verified gross revenue, on-time completion, and customer feedback into the hustler's **Financial Passport**.
2. The platform computes an algorithmic **Trust Score** (0–1000) based on completion rate, repeat hire ratio, dispute-free milestones, and total transaction volume.
3. The hustler can export this verified passport when applying for micro-loans or equipment financing.

---

## 5. Scope Boundaries: What We WANT vs What We DO NOT WANT

To ensure maximum judging impact, zero runtime failures during live evaluation, and razor-sharp execution before the deadline, the following boundaries are strictly enforced:

### ✅ What We WANT (Core Focus)
- **Real Intron Sahara Voice STT**: Direct integration with the official Intron API (`https://infer.voice.intron.io/file/v1/upload/sync`) with dialect support (`pcm` default, `yo` secondary).
- **Intelligent Gemini Extraction**: Dynamic schema-based extraction parsing messy conversational African speech into rigid database models.
- **Robust MongoDB Persistence**: All tasks, users, and state transitions persist cleanly in MongoDB.
- **Dual Voice Endpoints**: Voice-to-task creation (`/api/voice/transcribe`) AND voice-to-search (`/api/voice/search`).
- **Comprehensive Benchmarking**: Reproducible Colab benchmark notebook comparing Sahara against OpenAI Whisper Large-v3 and Meta MMS-1B on African Pidgin audio with WER, CER, and field accuracy metrics.
- **Clear Frontend Handoff**: Clean documentation allowing frontend engineers to build beautiful, modern UI surfaces without ambiguity.

### ❌ What We DO NOT WANT (Explicit Exclusions)
- **NO Text-to-Speech (TTS)**: The application will NOT generate voice audio responses. The response is visual (structured confirmation cards, updated feeds). *Rationale*: TTS introduces latency, robotic unnatural accents for Pidgin, and crucially triggers an extra hackathon requirement to benchmark 3+ TTS models.
- **NO Carrier Telephony / Twilio Live Webhooks**: Legacy Twilio phone call code (`agents/`) is intentionally disabled and unmounted in `main.py`. *Rationale*: Live telephony during a demo introduces carrier drops, ngrok tunnel latency, and network flakiness. Direct browser microphone recording is 100% dependable.
- **NO Touching Frontend Code in this Phase**: Backend and documentation are completely isolated. The frontend developer receives `docs/FRONTEND_HANDOFF.md` to connect the client.
- **NO Hardcoded Credentials**: No API keys or model names hardcoded in source files. All configuration reads from `.env`.

---

## 6. Technical Evolution & Architectural Log

### Starting State (Pre-Rebuild)
- The existing backend had stubbed endpoints (such as `POST /tasks/voice-intent`) that returned static hardcoded JSON fixtures (`category: "generator repair"`, `budget: 5000`).
- Voice logic was tied to complex Twilio agent phone calls requiring ngrok webhooks and telephony numbers.
- The repository contained scattered test scripts without a unified service architecture.

### The Rebuild Architecture
- Created a dedicated `Backend/services/` layer containing single-responsibility clients:
  - `sahara_client.py`: Handles audio conversion, multipart streaming, and Bearer authentication to Intron Sahara.
  - `gemini_extractor.py`: Configurable Gemini client enforcing structured Pydantic schemas.
- Introduced `Backend/routes/voice.py` to expose REST endpoints directly consumed by frontend clients.
- Cleanly separated the concerns: audio processing -> text extraction -> database transactions.
