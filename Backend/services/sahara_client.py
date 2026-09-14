"""Client for the Intron Sahara speech-to-text API (Sahara v2.5).

Verified against docs.voice.intron.io:
- Sync endpoint: POST https://infer.voice.intron.io/file/v1/upload/sync
  (audio <= 120s; returns HTTP 503 + file_id fallback beyond that)
- Multipart fields: audio_file_blob (file), audio_file_name (str),
  use_language_asr_input (language code)
- Transcript path: response["data"]["audio_transcript"]
- Native formats: wav, mp3, mp4, m4a, ogg, webm, flac — no server-side
  transcoding needed; pydub is only a fallback for unrecognized streams.
"""

import os
from io import BytesIO

import httpx

SAHARA_API_KEY = os.getenv("SAHARA_API_KEY", "")
SAHARA_ENDPOINT = "https://infer.voice.intron.io/file/v1/upload/sync"

DEFAULT_LANG = "pcm"
SUPPORTED_LANGS = {"pcm", "yo", "ha", "ig", "sw", "en"}

# Extensions Sahara parses natively — forwarded as-is, no conversion.
_NATIVE_EXTENSIONS = {"wav", "mp3", "mp4", "m4a", "ogg", "webm", "flac"}


def _extension(filename: str) -> str:
    name = (filename or "").lower()
    return name.rsplit(".", 1)[-1] if "." in name else ""


def _content_type_for(ext: str) -> str:
    return {
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
        "mp4": "audio/mp4",
        "m4a": "audio/mp4",
        "ogg": "audio/ogg",
        "webm": "audio/webm",
        "flac": "audio/flac",
    }.get(ext, "application/octet-stream")


def _to_wav(audio_bytes: bytes) -> tuple[bytes, str]:
    """Fallback conversion of an unrecognized stream to 16kHz mono WAV via pydub/ffmpeg."""
    from pydub import AudioSegment

    audio = AudioSegment.from_file(BytesIO(audio_bytes))
    audio = audio.set_channels(1).set_frame_rate(16000).set_sample_width(2)
    out = BytesIO()
    audio.export(out, format="wav")
    return out.getvalue(), "audio.wav"


async def transcribe(audio_bytes: bytes, lang: str = DEFAULT_LANG, filename: str = "audio.webm") -> str:
    """Send audio bytes to Sahara STT (sync) and return the transcript string.

    Raises RuntimeError with a descriptive message on any failure.
    """
    if not SAHARA_API_KEY:
        raise RuntimeError("SAHARA_API_KEY is not configured")

    lang = (lang or DEFAULT_LANG).lower()
    if lang not in SUPPORTED_LANGS:
        lang = DEFAULT_LANG

    ext = _extension(filename)
    if ext in _NATIVE_EXTENSIONS:
        send_bytes, send_name, content_type = audio_bytes, f"audio.{ext}", _content_type_for(ext)
    else:
        # Unrecognized/missing extension — try converting via pydub as a fallback.
        try:
            send_bytes, send_name = _to_wav(audio_bytes)
            content_type = "audio/wav"
        except Exception as exc:
            raise RuntimeError(f"Unsupported audio format (.{ext or 'unknown'}) and conversion failed: {exc}") from exc

    headers = {"Authorization": f"Bearer {SAHARA_API_KEY}"}
    data = {
        "audio_file_name": send_name,
        "use_language_asr_input": lang,
    }
    files = {"audio_file_blob": (send_name, send_bytes, content_type)}

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(SAHARA_ENDPOINT, headers=headers, data=data, files=files, timeout=120.0)
        except httpx.TimeoutException as exc:
            raise RuntimeError("Sahara STT request timed out") from exc
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Sahara STT request failed: {exc}") from exc

    if res.status_code == 401:
        raise RuntimeError("Sahara STT rejected the API key (401)")
    if res.status_code == 503:
        # Sync processing exceeded 120s; Sahara returns a file_id for async polling.
        file_id = ""
        try:
            file_id = res.json().get("data", {}).get("file_id", "")
        except ValueError:
            pass
        raise RuntimeError(f"Sahara STT sync timed out (503); file_id for async polling: {file_id or 'unknown'}")
    if res.status_code >= 400:
        raise RuntimeError(f"Sahara STT returned {res.status_code}: {res.text[:200]}")

    try:
        payload = res.json()
    except ValueError as exc:
        raise RuntimeError("Sahara STT returned a non-JSON response") from exc

    transcript = (payload.get("data") or {}).get("audio_transcript", "")
    if not transcript:
        raise RuntimeError("Sahara STT returned an empty transcript")
    return transcript
