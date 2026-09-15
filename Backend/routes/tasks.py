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
async def list_my_tasks(customer_id: Optional[str] = Query(None), hustler_id: Optional[str] = Query(None)):
    try:
        query: dict[str, Any] = {}
        if hustler_id:
            # Hustler view: only jobs this hustler accepted (recorded at match time).
            query["hustler_id"] = hustler_id
        elif customer_id:
            query["customer_id"] = customer_id
        tasks = await db.tasks.find(query).to_list(length=100)
        return [serialize_task(task) for task in tasks]
    except Exception:
        tasks = [serialize_task(task) for task in FALLBACK_TASKS if task.get("status") != "open"]
        if hustler_id:
            tasks = [task for task in tasks if task.get("hustler_id") == hustler_id]
        elif customer_id:
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
async def match_task(task_id: str, hustler_id: Optional[str] = Query(None)):
    try:
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        update: dict[str, Any] = {"status": "matched"}
        if hustler_id:
            update["hustler_id"] = hustler_id

        # Escrow lock: the customer's wallet is debited the moment the
        # hustler accepts, so the money is committed before work starts.
        customer_wallet: Optional[float] = None
        budget = float(task.get("budget") or 0)
        customer_id = task.get("customer_id")
        if customer_id and budget > 0:
            try:
                customer_oid = ObjectId(customer_id)
            except Exception:
                raise HTTPException(status_code=400, detail="Task has an invalid customer reference")

            customer = await db.users.find_one({"_id": customer_oid})
            if customer is None:
                raise HTTPException(status_code=404, detail="Customer not found")
            if float(customer.get("wallet_balance") or 0) < budget:
                raise HTTPException(
                    status_code=400,
                    detail="Insufficient wallet balance to lock escrow for this job",
                )

            title = task.get("title") or task.get("category", "Task")
            area = task.get("neighbourhood") or task.get("location") or "Lagos"
            await db.users.update_one(
                {"_id": customer_oid},
                {
                    "$inc": {"wallet_balance": -budget},
                    "$push": {"transactions": {
                        "type": "escrow", "amount": -budget, "date": "Today",
                        "desc": f"Escrow locked for {title}", "location": area,
                    }},
                },
            )
            updated = await db.users.find_one({"_id": customer_oid}, {"wallet_balance": 1})
            customer_wallet = round(float(updated.get("wallet_balance") or 0), 2)

        await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update})
        return {
            "status": "success",
            "task_id": task_id,
            "task_status": "matched",
            "customer_wallet_balance": customer_wallet,
        }
    except HTTPException:
        raise
    except Exception:
        for task in FALLBACK_TASKS:
            if str(task.get("_id")) == task_id:
                task.update(update)
                return {"status": "success", "task_id": task_id, "task_status": "matched"}
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
    """Stage-aware completion.

    - Hustler marks the job done (task is open/matched/in_progress):
      the task moves to `awaiting_confirmation`. No money moves yet; the
      hustler waits for the customer to review and release the escrow.
    - Customer releases the payment (task is `awaiting_confirmation`):
      the escrowed budget (already debited at accept) is credited to the
      hustler and the task becomes `completed`.
    """
    try:
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        status = task.get("status")

        if status == "completed":
            return {"status": "success", "task_id": task_id, "task_status": "completed"}

        if status != "awaiting_confirmation":
            # Hustler side: mark as done and wait for the customer.
            await db.tasks.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": {"status": "awaiting_confirmation", "marked_done_at": datetime.utcnow().isoformat()}},
            )
            return {
                "status": "success",
                "task_id": task_id,
                "task_status": "awaiting_confirmation",
                "message": "Marked as done. Waiting for the customer to release payment.",
            }

        # Customer side: release the escrow to the hustler.
        budget = float(task.get("budget") or 0)
        hustler_id = task.get("hustler_id")
        wallet_balances: dict[str, float] = {}

        if hustler_id and budget > 0:
            try:
                hustler_oid = ObjectId(hustler_id)
            except Exception:
                raise HTTPException(status_code=400, detail="Task has an invalid hustler reference")

            hustler = await db.users.find_one({"_id": hustler_oid})
            if hustler is None:
                raise HTTPException(status_code=404, detail="Hustler not found")

            title = task.get("title") or task.get("category", "Task")
            area = task.get("neighbourhood") or task.get("location") or "Lagos"
            await db.users.update_one(
                {"_id": hustler_oid},
                {
                    "$inc": {"wallet_balance": budget},
                    "$push": {"transactions": {
                        "type": "payout", "amount": budget, "date": "Today",
                        "desc": f"Payout for {title}", "location": area,
                    }},
                },
            )
            updated = await db.users.find_one({"_id": hustler_oid}, {"wallet_balance": 1})
            wallet_balances = {"hustler": round(float(updated.get("wallet_balance") or 0), 2)}

        await db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": "completed", "completed_at": datetime.utcnow().isoformat()}},
        )
        return {
            "status": "success",
            "task_id": task_id,
            "task_status": "completed",
            "wallet_balances": wallet_balances,
            "message": "Payment released to the hustler.",
        }
    except HTTPException:
        raise
    except Exception:
        for task in FALLBACK_TASKS:
            if str(task.get("_id")) == task_id:
                if task.get("status") == "awaiting_confirmation":
                    task["status"] = "completed"
                    return {"status": "success", "task_id": task_id, "task_status": "completed"}
                task["status"] = "awaiting_confirmation"
                return {"status": "success", "task_id": task_id, "task_status": "awaiting_confirmation"}
        raise HTTPException(status_code=404, detail="Task not found")
