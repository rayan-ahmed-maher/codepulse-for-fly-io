"""
Trending Domains Dashboard — Real-time Search Analytics
========================================================
Logs every domain search to Supabase.
GET /api/v1/trending/keywords  — top 10 keywords last 24h
GET /api/v1/trending/tlds      — top 5 TLDs with counts
GET /api/v1/trending/available — recently found available domains
"""
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from core.config import settings
from core.supabase_client import get_supabase

router = APIRouter(prefix="/trending", tags=["Trending"])
logger = logging.getLogger(__name__)


class SearchLogInput(BaseModel):
    keyword: str
    tld: Optional[str] = None
    domain: Optional[str] = None
    available: Optional[bool] = None
    price_inr: Optional[int] = None


# ── Log a search event ───────────────────────────────────────
@router.post("/log")
async def log_search(data: SearchLogInput):
    """Log a domain search event to Supabase."""
    sb = get_supabase()
    if not sb:
        return {"status": "skipped", "reason": "Supabase not configured"}

    try:
        sb.table("domain_searches").insert({
            "keyword": data.keyword.strip().lower(),
            "tld": data.tld or "",
            "domain": data.domain or "",
            "available": data.available,
            "price_inr": data.price_inr or 0,
            "searched_at": datetime.utcnow().isoformat(),
        }).execute()
        return {"status": "logged"}
    except Exception as e:
        logger.warning(f"[TRENDING] Failed to log search: {e}")
        return {"status": "error", "detail": str(e)}


# ── Top Keywords ──────────────────────────────────────────────
@router.get("/keywords")
async def top_keywords():
    """Return top 10 most searched keywords in last 24 hours."""
    sb = get_supabase()
    if not sb:
        return {"keywords": _mock_keywords()}

    try:
        since = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        result = (
            sb.table("domain_searches")
            .select("keyword")
            .gte("searched_at", since)
            .execute()
        )
        rows = result.data or []

        # Count frequencies
        freq: dict[str, int] = {}
        for row in rows:
            kw = row.get("keyword", "")
            if kw:
                freq[kw] = freq.get(kw, 0) + 1

        sorted_kw = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:10]
        return {
            "keywords": [{"keyword": kw, "count": count} for kw, count in sorted_kw],
            "since": since,
        }
    except Exception as e:
        logger.warning(f"[TRENDING] Keywords query failed: {e}")
        return {"keywords": _mock_keywords()}


# ── Top TLDs ──────────────────────────────────────────────────
@router.get("/tlds")
async def top_tlds():
    """Return top 5 most searched TLDs with counts."""
    sb = get_supabase()
    if not sb:
        return {"tlds": _mock_tlds()}

    try:
        since = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        result = (
            sb.table("domain_searches")
            .select("tld")
            .gte("searched_at", since)
            .execute()
        )
        rows = result.data or []

        freq: dict[str, int] = {}
        for row in rows:
            tld = row.get("tld", "")
            if tld:
                freq[tld] = freq.get(tld, 0) + 1

        total = max(sum(freq.values()), 1)
        sorted_tlds = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:5]
        return {
            "tlds": [
                {"tld": tld, "count": count, "percentage": round(count / total * 100)}
                for tld, count in sorted_tlds
            ]
        }
    except Exception as e:
        logger.warning(f"[TRENDING] TLDs query failed: {e}")
        return {"tlds": _mock_tlds()}


# ── Recently Available Domains ─────────────────────────────────
@router.get("/available")
async def recently_available():
    """Return last 10 available domains found by any user in past hour."""
    sb = get_supabase()
    if not sb:
        return {"domains": _mock_available()}

    try:
        since = (datetime.utcnow() - timedelta(hours=1)).isoformat()
        result = (
            sb.table("domain_searches")
            .select("domain, price_inr, searched_at")
            .eq("available", True)
            .gte("searched_at", since)
            .order("searched_at", desc=True)
            .limit(10)
            .execute()
        )
        rows = result.data or []
        return {
            "domains": [
                {
                    "domain": row["domain"],
                    "price_inr": row["price_inr"],
                    "searched_at": row["searched_at"],
                }
                for row in rows
                if row.get("domain")
            ]
        }
    except Exception as e:
        logger.warning(f"[TRENDING] Available query failed: {e}")
        return {"domains": _mock_available()}


# ── Mock data for when Supabase is not configured ─────────────
def _mock_keywords():
    return [
        {"keyword": "cloud", "count": 142},
        {"keyword": "deploy", "count": 98},
        {"keyword": "nexus", "count": 76},
        {"keyword": "bolt", "count": 61},
        {"keyword": "swift", "count": 54},
        {"keyword": "nova", "count": 47},
        {"keyword": "forge", "count": 39},
        {"keyword": "apex", "count": 33},
        {"keyword": "orbit", "count": 28},
        {"keyword": "pulse", "count": 21},
    ]


def _mock_tlds():
    return [
        {"tld": ".com", "count": 512, "percentage": 51},
        {"tld": ".io", "count": 198, "percentage": 20},
        {"tld": ".ai", "count": 143, "percentage": 14},
        {"tld": ".dev", "count": 98, "percentage": 10},
        {"tld": ".app", "count": 49, "percentage": 5},
    ]


def _mock_available():
    return [
        {"domain": "nexusforge.io", "price_inr": 4999, "searched_at": datetime.utcnow().isoformat()},
        {"domain": "cloudpulse.dev", "price_inr": 1299, "searched_at": datetime.utcnow().isoformat()},
        {"domain": "orbitly.tech", "price_inr": 599, "searched_at": datetime.utcnow().isoformat()},
        {"domain": "boltwave.app", "price_inr": 1499, "searched_at": datetime.utcnow().isoformat()},
        {"domain": "swiftdrop.xyz", "price_inr": 199, "searched_at": datetime.utcnow().isoformat()},
    ]
