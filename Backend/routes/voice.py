"""Voice transcription and voice-driven job search endpoints."""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

try:
    from ..database import db
    from ..services import gemini_extractor, sahara_client
except ImportError:
    from database import db
    from services import gemini_extractor, sahara_client

router = APIRouter()


async def _read_audio(file: Optional[UploadFile]) -> tuple[bytes, str]:
    if file is None:
        raise HTTPException(status_code=400, detail="No audio file provided")
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty")
    filename = file.filename or "audio.webm"
    return audio_bytes, filename


@router.post("/transcribe")
async def voice_transcribe(
    file: Optional[UploadFile] = File(None),
    lang: str = Form("pcm"),
):
    """Transcribe audio via Sahara STT and extract a task posting intent via Gemini.

    Returns `{transcript, entities}` where entities matches the shape the
    frontend's `voiceToIntentUpload` already expects.
    """
    audio_bytes, filename = await _read_audio(file)

    try:
        transcript = await sahara_client.transcribe(audio_bytes, lang=lang, filename=filename)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        intent = gemini_extractor.extract_task_intent(transcript)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Intent extraction failed: {exc}") from exc

    return {
        "transcript": transcript,
        "entities": {
            "title": intent.title,
            "description": intent.description,
            "category": intent.category,
            "budget": intent.budget,
            "neighbourhood": intent.neighbourhood,
        },
    }


@router.post("/search")
async def voice_search(
    file: Optional[UploadFile] = File(None),
    lang: str = Form("pcm"),
):
    """Transcribe audio via Sahara STT, extract search filters via Gemini, and query the tasks collection.

    Returns `{transcript, filters, jobs}`.
    """
    audio_bytes, filename = await _read_audio(file)

    try:
        transcript = await sahara_client.transcribe(audio_bytes, lang=lang, filename=filename)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        intent = gemini_extractor.extract_search_intent(transcript)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Intent extraction failed: {exc}") from exc

    # An all-empty intent (silence or unintelligible audio) must not degrade
    # into an unfiltered find({}) that returns every task in the database.
    if not (intent.category or intent.location or intent.keyword
            or intent.budget_min > 0 or intent.budget_max > 0):
        raise HTTPException(
            status_code=422,
            detail="No searchable terms were recognized in the recording. "
                   "Mention a trade, an area, or a budget and try again.",
        )

    # Voice search should only surface jobs that are still open — never
    # matched/in-progress/completed ones.
    query: dict[str, Any] = {"status": "open"}
    if intent.category:
        query["category"] = {"$regex": intent.category, "$options": "i"}
    if intent.location:
        query["$or"] = [
            {"location": {"$regex": intent.location, "$options": "i"}},
            {"neighbourhood": {"$regex": intent.location, "$options": "i"}},
        ]
    if intent.budget_min > 0 or intent.budget_max > 0:
        budget_query: dict[str, Any] = {}
        if intent.budget_min > 0:
            budget_query["$gte"] = intent.budget_min
        if intent.budget_max > 0:
            budget_query["$lte"] = intent.budget_max
        query["budget"] = budget_query
    if intent.keyword:
        keyword_regex = {"$regex": intent.keyword, "$options": "i"}
        keyword_clause = [{"title": keyword_regex}, {"description": keyword_regex}]
        if "$or" in query:
            query["$and"] = [{"$or": query.pop("$or")}, {"$or": keyword_clause}]
        else:
            query["$or"] = keyword_clause

    try:
        tasks = await db.tasks.find(query).sort("created_at", -1).to_list(length=50)
        jobs = []
        for task in tasks:
            item = dict(task)
            item["id"] = str(item.get("_id") or item.get("id"))
            item.pop("_id", None)
            jobs.append(item)
    except Exception:
        jobs = []

    return {
        "transcript": transcript,
        "filters": {
            "category": intent.category,
            "location": intent.location,
            "budget_min": intent.budget_min,
            "budget_max": intent.budget_max,
            "keyword": intent.keyword,
        },
        "jobs": jobs,
    }
