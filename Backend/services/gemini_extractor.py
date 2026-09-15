"""Gemini-based structured intent extraction from Sahara transcripts."""

import difflib
import os

from google import genai
from pydantic import BaseModel, Field

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

# Canonical marketplace categories. Trades spoken in Pidgin ("mechanic",
# "vulcanizer", "rewinder") are mapped onto this list so that voice-search
# Mongo queries line up with what customers post.
CANONICAL_CATEGORIES = [
    "General", "Cleaning", "Repairs", "Plumbing", "Electrical",
    "Errands", "Delivery", "Painting", "Carpentry", "Other",
]


def normalize_category(raw: str, fallback: str) -> str:
    """Map a free-text category onto CANONICAL_CATEGORIES.

    Exact or substring matches win, then fuzzy matching. If nothing is close
    enough, return `fallback`: "Other" for task postings (still a valid
    category), "" for searches (drops the filter instead of matching nothing).
    """
    if not raw:
        return fallback
    value = raw.strip().lower()
    lowered = [c.lower() for c in CANONICAL_CATEGORIES]
    for canonical, low in zip(CANONICAL_CATEGORIES, lowered):
        if value == low or value in low or low in value:
            return canonical
    close = difflib.get_close_matches(value, lowered, n=1, cutoff=0.6)
    if close:
        return CANONICAL_CATEGORIES[lowered.index(close[0])]
    return fallback

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
    category: str = Field(description="One of: General, Cleaning, Repairs, Plumbing, Electrical, Errands, Delivery, Painting, Carpentry, Other — closest match for the spoken trade")
    budget: float = Field(description="Budget amount in Naira mentioned by the user, 0 if none")
    neighbourhood: str = Field(description="Lagos neighbourhood or area the speaker mentioned, e.g. 'Lekki Phase 1'; empty string if none heard (never guess)")


class SearchIntent(BaseModel):
    """Structured job-search intent extracted from a hustler's voice."""

    category: str = Field(description="Job category to filter by, one of: General, Cleaning, Repairs, Plumbing, Electrical, Errands, Delivery, Painting, Carpentry, Other; empty string if not mentioned")
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
- Category must be one of: General, Cleaning, Repairs, Plumbing, Electrical, Errands, Delivery, Painting, Carpentry, Other. Map the spoken trade onto the closest one (e.g. "mechanic", "vulcanizer", "generator rewinder" -> Repairs or Electrical; if nothing fits, use Other).
- Neighbourhood must be a place the speaker actually mentioned — never guess a default. Use an empty string if no location is heard.
- If a field is not mentioned, use sensible defaults: category "General", budget 0, neighbourhood "".
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
- Category must be one of: General, Cleaning, Repairs, Plumbing, Electrical, Errands, Delivery, Painting, Carpentry, Other. Map the spoken trade onto the closest one; if nothing fits, use an empty string (do not invent a category).
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
    result.category = normalize_category(result.category, "Other")
    return result


def extract_search_intent(transcript: str) -> SearchIntent:
    """Extract a job-search intent from a transcript."""
    result = _extract(_SEARCH_PROMPT.format(transcript=transcript), SearchIntent)
    if result is None:
        raise RuntimeError("Gemini returned no parseable search intent")
    result.category = normalize_category(result.category, "")
    return result
