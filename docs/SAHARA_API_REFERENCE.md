# Intron Sahara Voice API — Verified Technical Reference

This document records the exact, verified technical specifications of the **Intron Sahara Voice API** (Sahara v2.5) sourced directly from the official documentation at `https://docs.voice.intron.io/`. Use this as the definitive guide for all backend integrations and benchmark scripts.

---

## 1. Endpoints & Base URL

* **Base URL**: `https://infer.voice.intron.io`
* **Authentication**: All endpoints require a Bearer token in the `Authorization` header:
  ```http
  Authorization: Bearer <SAHARA_API_KEY>
  ```
  *(API keys are generated via [voice.intron.io](https://voice.intron.io) under the **Developer** tab. There is no separate hidden competition endpoint).*

### Synchronous STT Upload (Primary for App & Benchmarks)
* **Method & Path**: `POST https://infer.voice.intron.io/file/v1/upload/sync`
* **Behavior**: Holds the HTTP connection open and returns the completed transcription directly in the response payload.
* **Duration Constraint**: Strictly limited to audio files **$\le 120$ seconds**.
* **Timeout Behavior**: If processing takes longer than 120 seconds, the request returns HTTP `503` with a `file_id` in the body, which can then be polled using the status endpoint.

### Asynchronous STT Upload (Legacy / Long Audio)
* **Method & Path**: `POST https://infer.voice.intron.io/file/v1/upload`
* **Behavior**: Returns a `file_id` immediately.
* **Status Polling**: `GET https://infer.voice.intron.io/file/v1/status/{file_id}` until `processing_status == "FILE_TRANSCRIBED"`.

---

## 2. Synchronous Upload Request Specification

* **Endpoint**: `POST https://infer.voice.intron.io/file/v1/upload/sync`
* **Content-Type**: `multipart/form-data`

### Multipart Form Fields

| Form Field Key | Type | Required | Default | Description / Notes |
|---|---|---|---|---|
| **`audio_file_blob`** | File (binary) | **YES** | — | **CRITICAL:** Field name is `audio_file_blob` (NOT `file`). |
| **`audio_file_name`** | String | **YES** | — | Non-unique file name with extension (e.g. `"audio.wav"`, `"voice.webm"`). |
| **`use_language_asr_input`** | String | **YES** | — | **CRITICAL:** Field name is `use_language_asr_input` (NOT `lang`). Language code (e.g. `"pcm"`, `"yo"`). |
| `use_disable_llm_corrections` | String | No | `"FALSE"` | `"TRUE"` or `"FALSE"`. Disables post-ASR LLM corrections for lower latency. |
| `use_category` | String | No | `file_category_telehealth` | Pre-processing/post-processing category (e.g. `file_category_general`). |
| `use_diarization` | String | No | — | `"TRUE"` or `"FALSE"`. Transcribes as diarized speaker segments. |
| `get_summary` | String | No | `"FALSE"` | Returns a transcript summary if `"TRUE"`. |
| `get_answer` | String | No | `"FALSE"` | Treats the transcript as a question and returns only the answer. |

---

## 3. Response JSON Schema

### Successful Response (`200 OK`)
```json
{
  "status": "Ok",
  "message": "file status found",
  "data": {
    "file_id": "12a9760f-b165-4404-91d0-a65d4cdt78fs",
    "processing_status": "FILE_TRANSCRIBED",
    "audio_file_name": "audio.wav",
    "audio_transcript": "Abeg I need person wey go service my generator for Lekki Phase 1",
    "processed_audio_duration_in_seconds": 12,
    "use_language_asr_input": "pcm"
  }
}
```

> [!CAUTION]
> **Extraction Path**: The transcript is strictly at **`response["data"]["audio_transcript"]`**.  
> Attempting to read `response["transcript"]` or `response["text"]` will return `KeyError` / `None`.

### Error Responses
* **HTTP `400 Bad Request`**: Audio duration exceeds 120 seconds or missing required fields (`audio_file_blob`, `audio_file_name`, `use_language_asr_input`).
* **HTTP `401 Unauthorized`**: Missing or invalid `Authorization: Bearer <API_KEY>`.
* **HTTP `503 Service Unavailable`**: Processing timed out (>120s). Body includes `file_id` to poll via `/file/v1/status/{file_id}`.

---

## 4. Supported Audio Formats

Sahara supports multiple formats natively. Audio recorded via mobile browsers can be sent directly without mandatory server-side transcoding:

| Format | Extensions | Browser Compatibility |
|---|---|---|
| **WAV** | `.wav` | Supported universally (PCM 16kHz recommended) |
| **WebM** | `.webm` | Supported natively (Chrome / Android `MediaRecorder`) |
| **OGG** | `.ogg` | Supported natively (Firefox `MediaRecorder`) |
| **MP4 / M4A** | `.mp4`, `.m4a` | Supported natively (Safari / iOS `MediaRecorder`) |
| **MP3** | `.mp3` | Supported natively |
| **FLAC** | `.flac` | Supported natively |

*Server-side `pydub` transcoding to WAV is optional and only required as a fallback if an unlisted or malformed stream is received.*

---

## 5. Supported African & Code-Switched Language Codes

From the official Intron Supported Languages matrix:

| Language Name | Code (`use_language_asr_input`) | Code-Switched Supported | Notes |
|---|---|---|---|
| **Nigerian Pidgin-English** | **`pcm`** | **✓** | **Primary target for AreaHustle** |
| **Yoruba-English** | **`yo`** | **✓** | **Secondary target for Lagos artisans** |
| **Hausa-English** | **`ha`** | **✓** | Northern Nigeria commerce |
| **Igbo-English** | **`ig`** | **✓** | Eastern Nigeria commerce |
| **Swahili-English** | **`sw`** | **✓** | East Africa commerce |
| **Standard English** | **`en`** | x | General English |
| **Akan-English** | **`ak`** | **✓** | Ghana |
| **Amharic-English** | **`am`** | **✓** | Ethiopia |
| **Luganda-English** | **`lg`** | **✓** | Uganda |
| **Kinyarwanda-English-French** | **`rw`** | **✓** | Rwanda |
| **Wolof-English** | **`wo`** | **✓** | Senegal |
| **Zulu-English** | **`zu`** | **✓** | South Africa |

---

## 6. Python Integration Snippet (Async / `httpx`)

```python
import httpx
import os

async def transcribe_with_sahara(audio_bytes: bytes, filename: str, lang: str = "pcm") -> str:
    url = "https://infer.voice.intron.io/file/v1/upload/sync"
    api_key = os.getenv("SAHARA_API_KEY")
    
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    files = {
        "audio_file_blob": (filename, audio_bytes, "audio/wav")
    }
    data = {
        "audio_file_name": filename,
        "use_language_asr_input": lang,
        "use_disable_llm_corrections": "FALSE"
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, headers=headers, files=files, data=data)
        response.raise_for_status()
        res_json = response.json()
        
        # Extract transcript from verified path
        return res_json.get("data", {}).get("audio_transcript", "")
```
