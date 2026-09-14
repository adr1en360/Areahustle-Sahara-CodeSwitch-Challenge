# Frontend Developer Handoff Specification

## 1. Message from the Backend Team

> **Hey Frontend Team!** 👋
> 
> The backend for AreaHustle has been refactored for the **Sahara CodeSwitch Africa Challenge**. 
> 
> All mock voice data, hardcoded fixtures, and unstable telephony webhooks have been eliminated. In their place is a production-ready **Intron Sahara Voice STT** and **Google Gemini** pipeline that processes real African code-switched audio (Nigerian Pidgin `pcm` and Yoruba `yo`) and returns structured marketplace data.
>
> Our job on the backend is completely focused on the pipeline, APIs, database, and benchmark accuracy. Your role on the frontend is to build an experience that will blow the hackathon judges away: a visually stunning, responsive interface that hides all the technical complexity under the hood so that a street artisan or a busy resident can use voice without friction.
>
> Below is everything you need to connect your UI to the backend.

---

## 2. API Endpoints Overview

The backend runs by default at `http://localhost:8000`. CORS is enabled for all standard frontend development ports (including `http://localhost:3000`).

| Method | Endpoint | Description | Payload Format |
|--------|----------|-------------|----------------|
| `POST` | `/api/voice/transcribe` | Transcribes spoken audio & extracts task entities | `multipart/form-data` |
| `POST` | `/api/voice/search` | Transcribes search query & filters open gigs | `multipart/form-data` |
| `POST` | `/api/tasks` | Persists confirmed task to MongoDB | `application/json` |
| `GET` | `/api/tasks` | Lists open tasks (supports filters) | URL query parameters |
| `POST` | `/api/tasks/{id}/match` | Hustler accepts a task | URL path param |
| `POST` | `/api/tasks/{id}/activate` | Hustler begins active work | URL path param |
| `POST` | `/api/tasks/{id}/complete` | Customer releases escrow & finishes | URL path param |

---

## 3. Detailed Endpoint Contracts

### 3.1. Voice Task Intent: `POST /api/voice/transcribe`
Call this when a customer finishes recording their voice request on `/Post-Task`.

#### Request
- **Headers**: `Content-Type: multipart/form-data`
- **Body Form Fields**:
  - `file`: The recorded audio blob (`.wav`, `.webm`, `.ogg`). Name the file e.g. `voice.wav` or `voice.webm`.
  - `lang`: (Optional) `"pcm"` for Nigerian Pidgin (default) or `"yo"` for Yoruba.

#### Expected Response (`200 OK`)
```json
{
  "status": "success",
  "language": "pcm",
  "transcript": "I need someone to come service my generator in Lekki Phase 1, budget is 10 thousand naira.",
  "entities": {
    "title": "Generator Servicing",
    "category": "Repairs",
    "budget": 10000.0,
    "neighbourhood": "Lekki Phase 1",
    "description": "Customer needs a technician to service a generator in Lekki Phase 1 for ₦10,000."
  }
}
```

#### What the Frontend Needs To Do:
1. When recording finishes, send the `audioBlob` as `file`.
2. Take the returned `entities` object and populate your form state:
   - `title` -> Title input
   - `category` -> Category badge
   - `budget` -> Budget field
   - `neighbourhood` -> Location field
   - `description` -> Description area
3. Display the raw `transcript` so the user can see Sahara accurately captured their speech!
4. When the user taps **"Lock Escrow to Confirm"**, call `POST /api/tasks` with those fields.

---

### 3.2. Voice Job Search: `POST /api/voice/search`
Call this when a hustler taps the floating microphone on the `/Jobs` marketplace.

#### Request
- **Headers**: `Content-Type: multipart/form-data`
- **Body Form Fields**:
  - `file`: The recorded audio blob.
  - `lang`: (Optional) `"pcm"` (default) or `"yo"`.

#### Expected Response (`200 OK`)
```json
{
  "status": "success",
  "transcript": "Show me generator work in Lekki.",
  "filters": {
    "category": "Repairs",
    "location": "Lekki Phase 1",
    "keyword": "generator"
  },
  "count": 2,
  "jobs": [
    {
      "id": "66e4a8b2...",
      "title": "Generator Servicing",
      "category": "Repairs",
      "budget": 10000.0,
      "neighbourhood": "Lekki Phase 1",
      "status": "open"
    }
  ]
}
```

#### What the Frontend Needs To Do:
1. Update the job feed state with `response.jobs`.
2. Display a small chip or filter pill showing the detected filters:
   - e.g. `Filtered by Voice: "generator" in "Lekki Phase 1" [Clear]`

---

## 4. Frontend Helper Implementation (TypeScript)

Add these functions to your `Frontend/src/lib/api.ts` file:

```typescript
// Add to Frontend/src/lib/api.ts

export const voiceApi = {
  /**
   * Send voice note to Sahara STT + Gemini for task creation
   */
  async transcribeVoiceTask(audioBlob: Blob, lang: string = "pcm") {
    const formData = new FormData();
    const ext = audioBlob.type.includes("webm") ? "webm" : "wav";
    formData.append("file", audioBlob, `speech.${ext}`);
    formData.append("lang", lang);

    const response = await fetch("http://localhost:8000/api/voice/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Voice transcription failed.");
    }

    return await response.json();
  },

  /**
   * Send spoken query to search and filter marketplace jobs
   */
  async voiceSearchJobs(audioBlob: Blob, lang: string = "pcm") {
    const formData = new FormData();
    const ext = audioBlob.type.includes("webm") ? "webm" : "wav";
    formData.append("file", audioBlob, `query.${ext}`);
    formData.append("lang", lang);

    const response = await fetch("http://localhost:8000/api/voice/search", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Voice search failed.");
    }

    return await response.json();
  }
};
```

---

1. **Brand Name**: Replace any legacy references to "Aethex" or "Twilio" with **"Sahara Voice"** or **"Intron Sahara"**.
2. **Language Toggle**: In `Post-Task/page.tsx`, add a clean pill toggle:
   - `[🇳🇬 Pidgin (Default)]` / `[Yoruba-English]`
   - Passing `"pcm"` or `"yo"` to the API.
3. **Escrow Visual Feedback**: When the user locks escrow, show an animated badge indicating funds are secured in escrow until the job is completed.
4. **Error Handling**: If the user's audio is inaudible, display a friendly toast: *"Could not clearly catch that. Please speak closer to the mic or try again."*
5. **API Base URL Configuration**: In `Frontend/.env.local`, set `NEXT_PUBLIC_API_URL=http://localhost:8000`. By default, `Frontend/src/lib/api.ts` falls back to a remote Render instance (`https://areahustle-backend.onrender.com`), which may be sleeping or unresponsive during local testing.
6. **Phone Number Field Contract**: Ensure your modals access `customerPhone` and `hustlerPhone`. The backend serializes both snake_case (`customer_phone`) and camelCase (`customerPhone`) to guarantee contact modals never display `undefined`.
