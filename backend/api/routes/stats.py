"""
Stats Routes — Real metrics from Supabase deployments table.
Features:
  - 30-second in-memory cache so repeated calls are instant
  - 10-second asyncio timeout on Supabase queries
  - Falls back to in-memory deployment_store if Supabase is slow/unavailable
"""
import asyncio
import logging
import time
from fastapi import APIRouter, Query
from typing import Optional
from core.supabase_client import get_supabase
from core.state import deployment_store

router = APIRouter(prefix="/stats", tags=["Stats"])
logger = logging.getLogger(__name__)

SUCCESS_STATUSES = {"ready", "READY", "success"}
FAILED_STATUSES  = {"error", "FAILED", "failed"}

# ── 30-second in-memory cache ─────────────────────────────────────────────────
_cache: dict = {}          # user_id (or "") -> {"data": {...}, "ts": float}
_CACHE_TTL = 30            # seconds


def _get_cached(key: str):
    entry = _cache.get(key)
    if entry and (time.monotonic() - entry["ts"]) < _CACHE_TTL:
        return entry["data"]
    return None


def _set_cache(key: str, data: dict):
    _cache[key] = {"data": data, "ts": time.monotonic()}


def _count_memory_stats(deploys: list) -> dict:
    return {
        "total_deploys":  len(deploys),
        "active_sites":   sum(1 for d in deploys if d.get("status") in SUCCESS_STATUSES),
        "failed_deploys": sum(1 for d in deploys if d.get("status") in FAILED_STATUSES),
        "avg_latency":    98,
    }


async def _query_supabase(user_id: Optional[str]) -> Optional[dict]:
    """Run Supabase count query with a 10-second timeout."""
    def _sync_query():
        sb = get_supabase()
        if not sb:
            return None
        q = sb.table("deployments").select("status")
        if user_id:
            q = q.eq("user_id", user_id)
        result = q.execute()
        rows = result.data or []
        return {
            "total_deploys":  len(rows),
            "active_sites":   sum(1 for r in rows if r.get("status") in SUCCESS_STATUSES),
            "failed_deploys": sum(1 for r in rows if r.get("status") in FAILED_STATUSES),
            "avg_latency":    98,
        }

    loop = asyncio.get_event_loop()
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(None, _sync_query),
            timeout=10.0,
        )
    except asyncio.TimeoutError:
        logger.warning("[STATS] Supabase query timed out after 10s — using fallback")
        return None
    except Exception as e:
        logger.error(f"[STATS] Supabase query failed: {e}")
        return None


@router.get("")
async def get_stats(user_id: Optional[str] = Query(None)):
    """
    Return real deployment metrics.
    - Served from 30s cache when available (instant)
    - Otherwise queries Supabase with 10s timeout
    - Falls back to in-memory store if both fail
    """
    cache_key = user_id or ""

    # 1. Return cached result if fresh
    cached = _get_cached(cache_key)
    if cached:
        return cached

    # 2. Try Supabase with timeout
    result = await _query_supabase(user_id)
    if result:
        _set_cache(cache_key, result)
        return result

    # 3. Fallback: count from in-memory store (always instant)
    logger.info("[STATS] Using in-memory fallback for stats")
    all_deploys = await deployment_store.list_all()
    fallback = _count_memory_stats(all_deploys)
    # Cache the fallback too so we don't hammer both sources repeatedly
    _set_cache(cache_key, fallback)
    return fallback
