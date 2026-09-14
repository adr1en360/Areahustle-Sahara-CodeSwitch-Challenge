from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from pydantic import BaseModel, Field

try:
    from ..database import db
except ImportError:
    from database import db

router = APIRouter()

FALLBACK_TASKS: list[dict[str, Any]] = [
    {
        "_id": "job-1",
        "title": "Fix my generator",
        "description": "Generator servicing and load test for a small apartment complex.",
        "category": "Repairs",
        "budget": 8000,
        "location": "Lekki Phase 1",
        "neighbourhood": "Lekki Phase 1",
        "status": "open",
        "customer": "Ada I.",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "_id": "job-2",
        "title": "House cleaning",
        "description": "Deep clean for a 3-bedroom apartment and balcony.",
        "category": "Cleaning",
        "budget": 6500,
        "location": "Yaba",
        "neighbourhood": "Yaba",
        "status": "open",
        "customer": "Musa R.",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "_id": "job-3",
        "title": "Plumber needed",
        "description": "Fix leaking pipe and replace kitchen sink trap.",
        "category": "Plumbing",
        "budget": 12000,
        "location": "Ikeja GRA",
        "neighbourhood": "Ikeja GRA",
        "status": "open",
        "customer": "Grace O.",
        "created_at": datetime.utcnow().isoformat(),
    },
]


def serialize_task(task: dict[str, Any]) -> dict[str, Any]:
    item = dict(task)
    item["id"] = str(item.get("_id") or item.get("id"))
    item.pop("_id", None)
    return item


async def _get_tasks_from_db(status: Optional[str] = None, neighbourhood: Optional[str] = None):
    try:
        query: dict[str, Any] = {}
        if status:
            query["status"] = status
        if neighbourhood:
            query["$or"] = [
                {"location": neighbourhood},
                {"neighbourhood": neighbourhood},
            ]
        tasks = await db.tasks.find(query).to_list(length=100)
        return [serialize_task(task) for task in tasks]
    except Exception:
        filtered = FALLBACK_TASKS[:]
        if status:
            filtered = [task for task in filtered if task.get("status") == status]
        if neighbourhood:
            filtered = [
                task for task in filtered
                if (task.get("location") == neighbourhood or task.get("neighbourhood") == neighbourhood)
            ]
        return [serialize_task(task) for task in filtered]


@router.get("/tasks")
async def list_tasks(
    status: Optional[str] = Query(None),
    neighbourhood: Optional[str] = Query(None),
):
    return await _get_tasks_from_db(status=status, neighbourhood=neighbourhood)


@router.get("/tasks/my")
async def list_my_tasks(customer_id: Optional[str] = Query(None)):
    try:
        query: dict[str, Any] = {}
        if customer_id:
            query["customer_id"] = customer_id
        tasks = await db.tasks.find(query).to_list(length=100)
        return [serialize_task(task) for task in tasks]
    except Exception:
        tasks = [serialize_task(task) for task in FALLBACK_TASKS if task.get("status") != "open"]
        if customer_id:
            tasks = [task for task in tasks if task.get("customer_id") == customer_id]
        return tasks


class TaskCreateRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    budget: float = 0
    neighbourhood: str = "Lekki Phase 1"
    category: str = "General"
    customer_id: Optional[str] = None
    status: str = "open"


@router.post("/tasks")
async def create_task(req: TaskCreateRequest):
    payload = {
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "budget": float(req.budget or 0),
        "location": req.neighbourhood,
        "neighbourhood": req.neighbourhood,
        "status": req.status,
        "customer": req.customer_id or "demo-customer",
        "customer_id": req.customer_id,
        "created_at": datetime.utcnow().isoformat(),
    }

    try:
        result = await db.tasks.insert_one(payload)
        payload["_id"] = str(result.inserted_id)
        return serialize_task(payload)
    except Exception:
        fallback = dict(payload)
        fallback["_id"] = f"task-{len(FALLBACK_TASKS) + 1}"
        FALLBACK_TASKS.insert(0, fallback)
        return serialize_task(fallback)


@router.post("/tasks/voice-intent")
async def voice_intent(file: UploadFile = File(None)):
    filename = (file.filename or "voice.wav").lower()
    content_type = file.content_type if file else "audio/wav"

    if file is None:
        return {
            "entities": {
                "category": "General",
                "description": "Need a reliable helper for a quick errand and setup in Lekki Phase 1.",
                "budget": 5000,
                "neighbourhood": "Lekki Phase 1",
            }
        }

    text_hint = "Need a reliable helper for a quick errand and setup in Lekki Phase 1."
    if "webm" in filename or "m4a" in filename or "aac" in filename:
        text_hint = "Need someone to deliver a package to Lekki Phase 1 for 5000 naira."

    return {
        "filename": filename,
        "content_type": content_type,
        "entities": {
            "category": "General",
            "description": text_hint,
            "budget": 5000,
            "neighbourhood": "Lekki Phase 1",
        },
    }


@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, payload: dict[str, Any]):
    try:
        update = {k: v for k, v in payload.items() if v is not None}
        if not update:
            return {"status": "success"}
        result = await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"status": "success", "task_id": task_id}
    except Exception:
        for task in FALLBACK_TASKS:
            if str(task.get("_id")) == task_id:
                task.update(payload)
                return {"status": "success", "task_id": task_id}
        raise HTTPException(status_code=404, detail="Task not found")


@router.post("/tasks/{task_id}/match")
async def match_task(task_id: str):
    try:
        result = await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": {"status": "matched"}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"status": "success", "task_id": task_id, "status": "matched"}
    except Exception:
        for task in FALLBACK_TASKS:
            if str(task.get("_id")) == task_id:
                task["status"] = "matched"
                return {"status": "success", "task_id": task_id, "status": "matched"}
        raise HTTPException(status_code=404, detail="Task not found")


@router.post("/tasks/{task_id}/activate")
async def activate_task(task_id: str):
    try:
        result = await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": {"status": "in_progress"}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"status": "success", "task_id": task_id, "status": "in_progress"}
    except Exception:
        for task in FALLBACK_TASKS:
            if str(task.get("_id")) == task_id:
                task["status"] = "in_progress"
                return {"status": "success", "task_id": task_id, "status": "in_progress"}
        raise HTTPException(status_code=404, detail="Task not found")


@router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str):
    try:
        result = await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": {"status": "completed"}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"status": "success", "task_id": task_id, "status": "completed"}
    except Exception:
        for task in FALLBACK_TASKS:
            if str(task.get("_id")) == task_id:
                task["status"] = "completed"
                return {"status": "success", "task_id": task_id, "status": "completed"}
        raise HTTPException(status_code=404, detail="Task not found")
