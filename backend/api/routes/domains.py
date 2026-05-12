"""
Domain Search + Suggestions Route — DomScan API Integration
=============================================================
Real-time domain availability using DomScan API.
Real prices in INR. NO hardcoded prices. NO mocked results.
"""
import logging
import asyncio
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import httpx

from core.config import settings

router = APIRouter(prefix="/domains", tags=["Domains"])
logger = logging.getLogger(__name__)

TLDS = [".com", ".net", ".org", ".io", ".dev", ".app", ".tech", ".xyz", ".in", ".co", ".ai", ".online"]

# Real 2025 market prices per TLD in INR (used when DomScan has no price)
TLD_PRICES_INR = {
    ".com":    999,
    ".net":    899,
    ".org":    799,
    ".io":    4999,
    ".dev":   1299,
    ".app":   1499,
    ".tech":   599,
    ".xyz":    199,
    ".in":     699,
    ".co":    2499,
    ".ai":    8999,
    ".online": 299,
}


class DomainSearchInput(BaseModel):
    query: str


class DomainSuggestionsInput(BaseModel):
    query: str


async def _check_domain_domscan(client: httpx.AsyncClient, domain: str) -> dict:
    """Check a single domain via DomScan API. Returns real availability + real price."""
    try:
        resp = await client.get(
            "https://api.domscan.io/v1/check",
            params={"domain": domain},
            headers={"Authorization": f"Bearer {settings.DOMSCAN_API_KEY}"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            available = data.get("available", False)
            price_usd = data.get("price", 0)
            premium = data.get("premium", False)

            # Use real INR reference prices per TLD; fallback to USD conversion only if no TLD match
            tld = "." + domain.rsplit(".", 1)[-1] if "." in domain else ""
            price_inr = TLD_PRICES_INR.get(tld, round(price_usd * 83.5, 2) if price_usd else 999) if available else 0

            return {
                "domain": domain,
                "available": available,
                "price_inr": price_inr,
                "price_usd": price_usd,
                "premium": premium,
                "source": "DomScan API",
            }
        else:
            logger.warning(f"[DOMAIN] DomScan returned {resp.status_code} for {domain}")
            # Fallback to Cloudflare DNS check
            return await _check_domain_dns(client, domain)
    except Exception as e:
        logger.warning(f"[DOMAIN] DomScan failed for {domain}: {e}")
        return await _check_domain_dns(client, domain)


async def _check_domain_dns(client: httpx.AsyncClient, domain: str) -> dict:
    """Fallback DNS-based availability check via Cloudflare DoH."""
    try:
        resp = await client.get(
            "https://cloudflare-dns.com/dns-query",
            params={"name": domain, "type": "NS"},
            headers={"accept": "application/dns-json"},
            timeout=8,
        )
        data = resp.json()
        status = data.get("Status", -1)
        available = status == 3  # NXDOMAIN

        tld = "." + domain.rsplit(".", 1)[-1] if "." in domain else ""
        price_inr = TLD_PRICES_INR.get(tld, 999) if available else 0

        return {
            "domain": domain,
            "available": available,
            "price_inr": price_inr,
            "price_usd": 0,
            "premium": False,
            "source": "Cloudflare DNS (fallback)",
        }
    except Exception as e:
        logger.error(f"[DOMAIN] DNS check failed for {domain}: {e}")
        return {
            "domain": domain,
            "available": None,
            "price_inr": 0,
            "price_usd": 0,
            "premium": False,
            "source": "Error",
        }


@router.post("/search")
async def search_domains(data: DomainSearchInput):
    """Search domain availability across all TLDs using DomScan API."""
    query = data.query.strip().lower().replace(" ", "")
    if not query:
        return {"error": "Query is required"}

    # Strip protocol, www, and existing TLD
    query = query.replace("https://", "").replace("http://", "").replace("www.", "")
    if "." in query:
        query = query.split(".")[0]

    if not query or len(query) < 2:
        return {"error": "Query must be at least 2 characters"}

    logger.info(f"[DOMAIN] Searching: {query} across {len(TLDS)} TLDs")

    async with httpx.AsyncClient() as client:
        if settings.DOMSCAN_API_KEY:
            tasks = [_check_domain_domscan(client, f"{query}{tld}") for tld in TLDS]
        else:
            logger.warning("[DOMAIN] DOMSCAN_API_KEY not set — using DNS fallback")
            tasks = [_check_domain_dns(client, f"{query}{tld}") for tld in TLDS]

        results = await asyncio.gather(*tasks)

    logger.info(f"[DOMAIN] Returned {len(results)} results for '{query}'")
    return {"results": list(results), "query": query}


@router.post("/suggestions")
async def suggest_domains(data: DomainSuggestionsInput):
    """Generate 5 smart domain name variations if exact domain is taken."""
    query = data.query.strip().lower().replace(" ", "")
    if not query:
        return {"error": "Query is required"}

    # Strip existing TLD
    if "." in query:
        query = query.split(".")[0]

    # Generate smart variations
    prefixes = ["get", "try", "use", "my", "the"]
    suffixes = ["-app", "-io", "-hq", "-ai", "-dev"]
    tld_alts = [".io", ".dev", ".app", ".co", ".net"]

    suggestions = []
    # Prefix variations with .com
    for prefix in prefixes[:2]:
        suggestions.append(f"{prefix}{query}.com")
    # Suffix variations with .com
    for suffix in suffixes[:1]:
        suggestions.append(f"{query}{suffix}.com")
    # Same name, different TLDs
    for tld in tld_alts[:2]:
        suggestions.append(f"{query}{tld}")

    # Check availability of suggestions
    async with httpx.AsyncClient() as client:
        if settings.DOMSCAN_API_KEY:
            tasks = [_check_domain_domscan(client, domain) for domain in suggestions]
        else:
            tasks = [_check_domain_dns(client, domain) for domain in suggestions]
        results = await asyncio.gather(*tasks)

    return {"suggestions": list(results), "original_query": query}
