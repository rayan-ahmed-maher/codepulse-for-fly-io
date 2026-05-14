"""
In-Memory + Supabase Persistent State Store
=============================================
Hybrid store: fast in-memory access for live polling + full Supabase persistence.

ROOT CAUSE FIX:
  The existing deployments table uses a UUID `id` column.
  Our tracking IDs (e.g. "deploy_abc123") are TEXT, not UUID.
  This file uses gen_random_uuid() for the DB `id` and stores tracking_id
  as a separate TEXT column for reverse lookups.

SCHEMA REQUIRED (run in Supabase SQL Editor if tracking_id column is missing):
  ALTER TABLE public.deployments ADD COLUMN IF NOT EXISTS tracking_id text UNIQUE;
  CREATE INDEX IF NOT EXISTS idx_deployments_tracking_id ON public.deployments(tracking_id);
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Only these columns exist in the DB. Everything else stays in-memory only.
_DB_COLUMNS = {
    "tracking_id", "project_name", "platform", "status", "url",
    "error", "reason", "evidence", "solution",
    "framework", "file_count", "user_id", "created_at", "updated_at",
}


def _filter_for_db(data: dict) -> dict:
    """Strip keys that are not DB columns to prevent Supabase schema errors."""
    return {k: v for k, v in data.items() if k in _DB_COLUMNS}


class StateStore:
    """Hybrid deployment store — memory-first with Supabase persistence."""

    def __init__(self):
        self._lock = asyncio.Lock()
        self._deployments: Dict[str, Dict[str, Any]] = {}
        self._loaded = False

    # ── Private helpers ───────────────────────────────────────────────────────

    def _get_sb(self):
        try:
            from core.supabase_client import get_supabase
            return get_supabase()
        except Exception as e:
            print(f"[STATE] get_supabase() error: {e}")
            return None

    async def _load_from_db(self) -> None:
        """Bootstrap in-memory store from Supabase at first access."""
        if self._loaded:
            return
        self._loaded = True

        sb = self._get_sb()
        if not sb:
            print("[STATE] Supabase not available — starting empty")
            return

        try:
            result = sb.table("deployments").select("*").order("created_at", desc=True).limit(200).execute()
            rows = result.data or []
            for row in rows:
                # Index by tracking_id if available, otherwise by DB uuid id
                tid = row.get("tracking_id") or row.get("id")
                if tid:
                    self._deployments[tid] = row
            print(f"[STATE] Bootstrap complete -- {len(rows)} deployments loaded from Supabase")
        except Exception as e:
            print(f"[STATE] Bootstrap failed: {e}")

    async def _save_to_db(self, tracking_id: str, data: dict) -> None:
        """Upsert to Supabase using tracking_id as the conflict key."""
        sb = self._get_sb()
        if not sb:
            print(f"[STATE] _save_to_db: Supabase unavailable for {tracking_id}")
            return

        record = _filter_for_db({
            **data,
            "tracking_id": tracking_id,
            "user_id":     str(data.get("user_id") or "dev-user"),
            "updated_at":  datetime.now(timezone.utc).isoformat(),
        })
        if "created_at" not in record:
            record["created_at"] = datetime.now(timezone.utc).isoformat()

        print(f"[STATE] Upserting tracking_id={tracking_id} | status={record.get('status')} | record_keys={list(record.keys())}")

        try:
            # Upsert on tracking_id (text column), let Supabase generate UUID for `id`
            result = sb.table("deployments").upsert(record, on_conflict="tracking_id").execute()
            print(f"[STATE] Upsert OK -- result.data={result.data}")
        except Exception as e:
            print(f"[STATE] Upsert FAILED for {tracking_id}: {e}")

    # ── Public API ────────────────────────────────────────────────────────────

    async def create(self, tracking_id: str, data: Dict[str, Any]) -> None:
        """Create new deployment in memory then persist to Supabase."""
        print(f"[STATE] create() -- tracking_id={tracking_id}")
        now = datetime.now(timezone.utc).isoformat()
        record = {
            **data,
            "tracking_id": tracking_id,
            "id":          tracking_id,   # keep in-memory for compatibility
            "created_at":  now,
            "updated_at":  now,
        }
        async with self._lock:
            if not self._loaded:
                await self._load_from_db()
            self._deployments[tracking_id] = record

        await self._save_to_db(tracking_id, record)

    async def update(self, tracking_id: str, updates: Dict[str, Any]) -> None:
        """Update deployment in memory then persist to Supabase."""
        print(f"[STATE] update() -- tracking_id={tracking_id} | keys={list(updates.keys())}")
        async with self._lock:
            if not self._loaded:
                await self._load_from_db()

            if tracking_id in self._deployments:
                self._deployments[tracking_id].update(updates)
            else:
                self._deployments[tracking_id] = {
                    **updates,
                    "tracking_id": tracking_id,
                    "id":          tracking_id,
                    "created_at":  datetime.now(timezone.utc).isoformat(),
                }
            self._deployments[tracking_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
            snapshot = dict(self._deployments[tracking_id])

        await self._save_to_db(tracking_id, snapshot)

    async def get(self, tracking_id: str) -> Optional[Dict[str, Any]]:
        """Get by tracking_id — memory first, then Supabase fallback."""
        async with self._lock:
            if not self._loaded:
                await self._load_from_db()
            if tracking_id in self._deployments:
                return self._deployments[tracking_id]

        # Cache miss — fetch from Supabase by tracking_id column
        sb = self._get_sb()
        if sb:
            try:
                result = sb.table("deployments").select("*").eq("tracking_id", tracking_id).limit(1).execute()
                if result.data:
                    row = result.data[0]
                    async with self._lock:
                        self._deployments[tracking_id] = row
                    return row
            except Exception as e:
                print(f"[STATE] get() Supabase fetch failed for {tracking_id}: {e}")
        return None

    async def list_all(self) -> list:
        """List all deployments — Supabase first for complete persistent history."""
        sb = self._get_sb()
        if sb:
            try:
                result = sb.table("deployments").select("*").order("created_at", desc=True).limit(200).execute()
                rows = result.data or []
                if rows is not None:   # even empty list is a valid DB response
                    async with self._lock:
                        for row in rows:
                            tid = row.get("tracking_id") or row.get("id")
                            if tid:
                                self._deployments[tid] = row
                    return rows
            except Exception as e:
                print(f"[STATE] list_all() Supabase query failed: {e}")

        async with self._lock:
            return sorted(
                self._deployments.values(),
                key=lambda d: d.get("created_at", ""),
                reverse=True,
            )

    async def self_test(self) -> dict:
        """Run at startup — validates credentials, table access and upsert ability."""
        print("\n[STATE] === Supabase Persistence Self-Test ===")

        from core.config import settings
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY
        print(f"[STATE] SUPABASE_URL        = {url[:35] if url else '(EMPTY)'}")
        print(f"[STATE] SERVICE_ROLE_KEY    = {key[:20] if key else '(EMPTY)'}...")
        print(f"[STATE] has_supabase        = {settings.has_supabase}")

        if not settings.has_supabase:
            print("[STATE] FAIL: credentials missing -- persistence DISABLED")
            return {"ok": False, "reason": "credentials_missing"}

        sb = self._get_sb()
        if not sb:
            print("[STATE] FAIL: Supabase client init failed")
            return {"ok": False, "reason": "client_init_failed"}

        # Check table exists and tracking_id column is present
        try:
            result = sb.table("deployments").select("tracking_id").limit(1).execute()
            print(f"[STATE] READ test passed (tracking_id column exists). Rows: {len(result.data or [])}")
        except Exception as e:
            print(f"[STATE] READ test FAILED: {e}")
            if "tracking_id" in str(e):
                print("[STATE] --> tracking_id column MISSING from table.")
                print("[STATE] --> Run this in Supabase SQL Editor:")
                print("[STATE]     ALTER TABLE public.deployments ADD COLUMN IF NOT EXISTS tracking_id text UNIQUE;")
                print("[STATE]     CREATE INDEX IF NOT EXISTS idx_deployments_tracking_id ON public.deployments(tracking_id);")
            else:
                print("[STATE] --> deployments table may not exist. Run the SQL setup script.")
            return {"ok": False, "reason": str(e)}

        # Upsert test
        test_tid = "__state_selftest__"
        try:
            sb.table("deployments").upsert({
                "tracking_id":  test_tid,
                "project_name": "__self_test__",
                "platform":     "test",
                "status":       "test",
                "user_id":      "dev-user",
                "updated_at":   datetime.now(timezone.utc).isoformat(),
            }, on_conflict="tracking_id").execute()
            print(f"[STATE] WRITE test passed -- upsert on tracking_id succeeded")
            sb.table("deployments").delete().eq("tracking_id", test_tid).execute()
            print(f"[STATE] DELETE test passed -- cleanup succeeded")
        except Exception as e:
            print(f"[STATE] WRITE test FAILED: {e}")
            return {"ok": False, "reason": str(e)}

        print("[STATE] All self-tests PASSED -- persistence is ACTIVE")
        print("[STATE] ==========================================\n")
        return {"ok": True}


# Singleton
deployment_store = StateStore()
