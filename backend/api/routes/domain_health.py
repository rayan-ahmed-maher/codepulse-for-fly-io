"""
Domain Health Score — Multi-signal Safety Analysis
===================================================
POST /api/v1/domain/health
Runs spam check (Serper), social handle checks (HTTP HEAD),
WHOIS-via-DNS age estimation, and returns a 0-100 score.
"""
import logging
import asyncio
from fastapi import APIRouter
from pydantic import BaseModel
import httpx

from core.config import settings

router = APIRouter(prefix="/domain", tags=["Domain Health"])
logger = logging.getLogger(__name__)

SOCIAL_PLATFORMS = {
    "Twitter":   "https://twitter.com/{handle}",
    "Instagram": "https://www.instagram.com/{handle}",
    "GitHub":    "https://github.com/{handle}",
    "YouTube":   "https://www.youtube.com/@{handle}",
}


class DomainHealthInput(BaseModel):
    domain: str


async def _check_spam(client: httpx.AsyncClient, domain: str) -> dict:
    """Query Serper for spam/complaint signals about the domain."""
    if not settings.SERPER_API_KEY:
        return {"clean": True, "signals": 0, "note": "Serper not configured — assumed clean"}

    try:
        resp = await client.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": settings.SERPER_API_KEY, "Content-Type": "application/json"},
            json={"q": f'"{domain}" spam OR scam OR phishing OR malware', "num": 5},
            timeout=10,
        )
        data = resp.json()
        result_count = len(data.get("organic", []))
        clean = result_count < 3
        return {"clean": clean, "signals": result_count, "note": f"{result_count} negative signals found"}
    except Exception as e:
        logger.warning(f"[HEALTH] Spam check failed for {domain}: {e}")
        return {"clean": True, "signals": 0, "note": "Spam check unavailable"}


async def _check_seo(client: httpx.AsyncClient, domain: str) -> dict:
    """Query Serper for organic mentions/backlinks."""
    if not settings.SERPER_API_KEY:
        return {"mentions": 0, "score": 50, "note": "Serper not configured"}

    try:
        resp = await client.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": settings.SERPER_API_KEY, "Content-Type": "application/json"},
            json={"q": f'site:{domain} OR "{domain}"', "num": 10},
            timeout=10,
        )
        data = resp.json()
        mentions = len(data.get("organic", []))
        # More mentions = established domain (could be good or bad depending on spam)
        score = min(100, mentions * 10)
        return {"mentions": mentions, "score": score, "note": f"{mentions} indexed pages found"}
    except Exception as e:
        logger.warning(f"[HEALTH] SEO check failed for {domain}: {e}")
        return {"mentions": 0, "score": 50, "note": "SEO check unavailable"}


async def _check_dns_age(client: httpx.AsyncClient, domain: str) -> dict:
    """
    Check if domain is registered (exists in DNS).
    A domain with NS records exists — it may be aged.
    NXDOMAIN = brand new / unregistered.
    """
    try:
        resp = await client.get(
            "https://cloudflare-dns.com/dns-query",
            params={"name": domain, "type": "NS"},
            headers={"accept": "application/dns-json"},
            timeout=8,
        )
        data = resp.json()
        status = data.get("Status", -1)
        if status == 3:  # NXDOMAIN
            return {"registered": False, "age_label": "New / Available", "points": 20}
        elif status == 0 and data.get("Answer"):
            return {"registered": True, "age_label": "Registered Domain", "points": 5}
        else:
            return {"registered": None, "age_label": "Unknown", "points": 10}
    except Exception as e:
        logger.warning(f"[HEALTH] DNS age check failed: {e}")
        return {"registered": None, "age_label": "Unknown", "points": 10}


async def _check_social_handle(client: httpx.AsyncClient, platform: str, url: str) -> dict:
    """HEAD request to check if a social handle page exists."""
    try:
        resp = await client.head(url, timeout=6, follow_redirects=True,
                                  headers={"User-Agent": "Mozilla/5.0"})
        available = resp.status_code == 404
        return {"platform": platform, "available": available, "status": resp.status_code}
    except Exception:
        return {"platform": platform, "available": None, "status": None}


@router.post("/health")
async def check_domain_health(data: DomainHealthInput):
    """Run multi-signal health analysis on a domain name."""
    domain = data.domain.strip().lower()
    if not domain:
        return {"error": "Domain is required"}

    # Extract base handle (without TLD) for social checks
    handle = domain.split(".")[0]
    logger.info(f"[HEALTH] Checking health for: {domain}")

    async with httpx.AsyncClient() as client:
        # Run all checks concurrently
        spam_task = _check_spam(client, domain)
        seo_task = _check_seo(client, domain)
        dns_task = _check_dns_age(client, domain)
        social_tasks = [
            _check_social_handle(client, platform, url.format(handle=handle))
            for platform, url in SOCIAL_PLATFORMS.items()
        ]

        spam, seo, dns_age, *social_results = await asyncio.gather(
            spam_task, seo_task, dns_task, *social_tasks
        )

    # ── Score Calculation ──────────────────────────────────────
    score = 0

    # Spam: +40 if clean
    spam_points = 40 if spam["clean"] else max(0, 40 - spam["signals"] * 8)
    score += spam_points

    # DNS age: new domain scores higher
    score += dns_age["points"]

    # Social handles available: +5 per platform available
    social_available = [s for s in social_results if s["available"] is True]
    social_points = len(social_available) * 5
    score += min(20, social_points)

    # SEO: if newly registered (low mentions) it's clean; if many signals, mixed
    seo_points = 20 if seo["mentions"] < 5 else max(0, 20 - (seo["mentions"] - 5) * 2)
    score += seo_points

    score = max(0, min(100, score))

    # ── Verdict ───────────────────────────────────────────────
    if score >= 71:
        verdict = "SAFE TO BUY"
        verdict_color = "#10b981"
    elif score >= 41:
        verdict = "REVIEW BEFORE BUYING"
        verdict_color = "#f59e0b"
    else:
        verdict = "HIGH RISK"
        verdict_color = "#ef4444"

    return {
        "domain": domain,
        "score": score,
        "verdict": verdict,
        "verdict_color": verdict_color,
        "categories": {
            "spam": {
                "label": "Spam History",
                "status": "Clean" if spam["clean"] else "Warning",
                "points": spam_points,
                "max": 40,
                "note": spam["note"],
            },
            "age": {
                "label": "Domain Age",
                "status": dns_age["age_label"],
                "points": dns_age["points"],
                "max": 20,
                "registered": dns_age["registered"],
            },
            "seo": {
                "label": "SEO Authority",
                "score": seo["score"],
                "mentions": seo["mentions"],
                "points": seo_points,
                "max": 20,
                "note": seo["note"],
            },
            "social": {
                "label": "Social Handles",
                "platforms": social_results,
                "available_count": len(social_available),
                "points": social_points,
                "max": 20,
            },
        },
    }
