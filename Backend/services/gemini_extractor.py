"""Gemini-based structured intent extraction from Sahara transcripts."""

import os

from google import genai
from pydantic import BaseModel, Field

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


class TaskIntent(BaseModel):
    """Structured task posting intent extracted from a customer's voice."""

    title: str = Field(description="Short task title, e.g. 'Fix my generator'")
    description: str = Field(description="One or two sentence description of the task in plain English")
    category: str = Field(description="Task category: General, Cleaning, Repairs, Plumbing, Electrical, Errands, Delivery, Painting, Carpentry, or Other")
    budget: float = Field(description="Budget amount in Naira mentioned by the user, 0 if none")
    neighbourhood: str = Field(description="Lagos neighbourhood or area mentioned, e.g. 'Lekki Phase 1'")


class SearchIntent(BaseModel):
    """Structured job-search intent extracted from a hustler's voice."""

    category: str = Field(description="Job category to filter by, empty string if not mentioned")
    location: str = Field(description="Neighbourhood or area to filter by, empty string if not mentioned")
    budget_min: float = Field(description="Minimum acceptable budget in Naira, 0 if not mentioned")
    budget_max: float = Field(description="Maximum acceptable budget in Naira, 0 if not mentioned")
    keyword: str = Field(description="Single keyword to match against job titles/descriptions, empty string if not applicable")


_TASK_PROMPT = """\
You are a data extraction engine for AreaHustle, a voice-first gig marketplace in Lagos, Nigeria.

The transcript below was produced by a speech-to-text system from a Nigerian customer speaking
Nigerian Pidgin English mixed with English (code-switching). Extract the task posting intent.

Rules:
- Translate Pidgin phrasing into clear plain English for the title and description.
- Budget may be phrased as "5k", "five thousand naira", "10 bags" etc. — always convert to a Naira amount.
- If a field is not mentioned, use sensible defaults: category "General", budget 0, neighbourhood "Lekki Phase 1".
- Respond only with structured JSON matching the schema.

Transcript: "{transcript}"
"""

_SEARCH_PROMPT = """\
You are a data extraction engine for AreaHustle, a voice-first gig marketplace in Lagos, Nigeria.

The transcript below was produced by a speech-to-text system from a hustler (gig worker) speaking
Nigerian Pidgin English mixed with English (code-switching). Extract their job-search intent.

Rules:
- Translate Pidgin phrasing into clear plain English for the keyword.
- Budget bounds may be phrased as "at least 5k", "nothing below 10k", "up to 20 thousand" etc. — convert to Naira amounts.
- Use 0 for any bound that was not mentioned. Use empty strings for category/location/keyword when not mentioned.
- Respond only with structured JSON matching the schema.

Transcript: "{transcript}"
"""


def _extract(prompt: str, schema: type[BaseModel]):
    client = _get_client()
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": schema,
            "temperature": 0.1,
        },
    )
    return response.parsed


def extract_task_intent(transcript: str) -> TaskIntent:
    """Extract a task posting intent from a transcript."""
    result = _extract(_TASK_PROMPT.format(transcript=transcript), TaskIntent)
    if result is None:
        raise RuntimeError("Gemini returned no parseable task intent")
    return result


def extract_search_intent(transcript: str) -> SearchIntent:
    """Extract a job-search intent from a transcript."""
    result = _extract(_SEARCH_PROMPT.format(transcript=transcript), SearchIntent)
    if result is None:
        raise RuntimeError("Gemini returned no parseable search intent")
    return result
