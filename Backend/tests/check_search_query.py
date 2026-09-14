"""Manual check of the Mongo query construction used by /api/voice/search."""

import asyncio
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import db


def build_query(category: str, location: str, budget_min: float, budget_max: float, keyword: str) -> dict[str, Any]:
    query: dict[str, Any] = {}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if location:
        query["$or"] = [
            {"location": {"$regex": location, "$options": "i"}},
            {"neighbourhood": {"$regex": location, "$options": "i"}},
        ]
    if budget_min > 0 or budget_max > 0:
        budget_query: dict[str, Any] = {}
        if budget_min > 0:
            budget_query["$gte"] = budget_min
        if budget_max > 0:
            budget_query["$lte"] = budget_max
        query["budget"] = budget_query
    if keyword:
        keyword_regex = {"$regex": keyword, "$options": "i"}
        keyword_clause = [{"title": keyword_regex}, {"description": keyword_regex}]
        if "$or" in query:
            query["$and"] = [{"$or": query.pop("$or")}, {"$or": keyword_clause}]
        else:
            query["$or"] = keyword_clause
    return query


CASES = [
    ("category+location filter", dict(category="Cleaning", location="Yaba", budget_min=0, budget_max=0, keyword="")),
    ("budget min only", dict(category="", location="", budget_min=6000, budget_max=0, keyword="")),
    ("budget range", dict(category="", location="", budget_min=5000, budget_max=10000, keyword="")),
    ("keyword only", dict(category="", location="", budget_min=0, budget_max=0, keyword="generator")),
    ("location+keyword combined", dict(category="", location="Yaba", budget_min=0, budget_max=0, keyword="paint")),
]


async def main():
    for name, kwargs in CASES:
        query = build_query(**kwargs)
        docs = await db.tasks.find(query, {"title": 1, "_id": 0}).to_list(10)
        titles = [d["title"] for d in docs]
        print(f"{name}:\n  query -> {query}\n  matched -> {titles}")


if __name__ == "__main__":
    asyncio.run(main())
