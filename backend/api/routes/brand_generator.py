"""
AI Brand Name Generator — NVIDIA NIM Integration
=================================================
POST /api/v1/brand/generate
Generates 10 creative brand names from a keyword,
checks domain availability, and returns combined results.
"""
import json
import logging
import asyncio
import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import httpx

from core.config import settings

router = APIRouter(prefix="/brand", tags=["Brand Generator"])
logger = logging.getLogger(__name__)

# TLD prices mirror (same as domains.py)
TLD_PRICES_INR = {
    ".com": 999, ".net": 899, ".org": 799, ".io": 4999,
    ".dev": 1299, ".app": 1499, ".tech": 599, ".xyz": 199,
    ".in": 699, ".co": 2499, ".ai": 8999, ".online": 299,
}

NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

BRAND_PROMPT = """Generate exactly 10 creative, brandable, memorable business domain name ideas based on the keyword "{keyword}".

Return ONLY a valid JSON array. No markdown, no explanation, no extra text.

Each item must have these exact keys:
- name: the brand name (string)
- domain: suggested .com domain lowercase (string, e.g. "brandname.com")
- meaning: one sentence explanation (string)
- memorability_score: integer 1-10
- style: one of "Modern", "Playful", "Professional", "Tech", "Creative" (string)
- tagline: one catchy tagline (string)

Example format:
[{{"name":"Nexify","domain":"nexify.com","meaning":"...","memorability_score":8,"style":"Tech","tagline":"..."}}]"""


async def _check_domain_availability(client: httpx.AsyncClient, domain: str) -> dict:
    """Quick DNS-based availability check for a generated domain."""
    try:
        resp = await client.get(
            "https://cloudflare-dns.com/dns-query",
            params={"name": domain, "type": "NS"},
            headers={"accept": "application/dns-json"},
            timeout=6,
        )
        data = resp.json()
        available = data.get("Status", -1) == 3  # NXDOMAIN = available
        tld = "." + domain.rsplit(".", 1)[-1] if "." in domain else ".com"
        price_inr = TLD_PRICES_INR.get(tld, 999) if available else 0
        return {"domain": domain, "available": available, "price_inr": price_inr}
    except Exception:
        return {"domain": domain, "available": None, "price_inr": 0}


class BrandGenerateInput(BaseModel):
    keyword: str
    count: Optional[int] = 10


@router.post("/generate")
async def generate_brand_names(data: BrandGenerateInput):
    """Generate AI brand names and check domain availability."""
    keyword = data.keyword.strip()
    if not keyword or len(keyword) < 2:
        return {"error": "Keyword must be at least 2 characters"}

    if not settings.NVIDIA_API_KEY:
        return {"error": "NVIDIA_API_KEY not configured", "suggestions": _fallback_brands(keyword)}

    logger.info(f"[BRAND] Generating names for keyword: {keyword}")

    # ── Step 1: Call NVIDIA NIM ──────────────────────────────
    brands = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                NVIDIA_CHAT_URL,
                headers={
                    "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "meta/llama-3.1-8b-instruct",
                    "messages": [
                        {"role": "system", "content": "You are a branding expert. Always respond with valid JSON only. No markdown code blocks."},
                        {"role": "user", "content": BRAND_PROMPT.format(keyword=keyword)},
                    ],
                    "temperature": 0.85,
                    "max_tokens": 2048,
                },
                timeout=30,
            )

        if resp.status_code != 200:
            logger.error(f"[BRAND] NVIDIA API error {resp.status_code}: {resp.text[:300]}")
            return {"error": "AI service temporarily unavailable", "suggestions": _fallback_brands(keyword)}

        content = resp.json()["choices"][0]["message"]["content"].strip()

        # Strip markdown code blocks if present
        content = re.sub(r"```(?:json)?", "", content).strip()

        brands = json.loads(content)
        if not isinstance(brands, list):
            brands = []

    except (json.JSONDecodeError, KeyError, Exception) as e:
        logger.error(f"[BRAND] Parse/API error: {e}")
        brands = _fallback_brands(keyword)

    # ── Step 2: Check availability for each suggested domain ──
    domains_to_check = [b.get("domain", "") for b in brands if b.get("domain")]

    async with httpx.AsyncClient() as client:
        tasks = [_check_domain_availability(client, d) for d in domains_to_check]
        availability_results = await asyncio.gather(*tasks)

    avail_map = {r["domain"]: r for r in availability_results}

    # ── Step 3: Merge ─────────────────────────────────────────
    for brand in brands:
        domain = brand.get("domain", "")
        avail = avail_map.get(domain, {"available": None, "price_inr": 0})
        brand["available"] = avail["available"]
        brand["price_inr"] = avail["price_inr"]
        # Clamp score
        brand["memorability_score"] = max(1, min(10, int(brand.get("memorability_score", 7))))

    logger.info(f"[BRAND] Returning {len(brands)} brand ideas for '{keyword}'")
    return {"keyword": keyword, "suggestions": brands}


def _fallback_brands(keyword: str) -> list:
    """Returns placeholder brands when AI is unavailable."""
    bases = [
        ("Nexify", "Modern"), ("Boldly", "Playful"), ("Zenpulse", "Creative"),
        ("Launchly", "Tech"), ("Vaultr", "Professional"), ("Driftware", "Modern"),
        ("Sparkio", "Creative"), ("Truepath", "Professional"), ("Glowr", "Playful"), ("Shiftr", "Tech"),
    ]
    return [
        {
            "name": f"{b[0]}",
            "domain": f"{b[0].lower()}.com",
            "meaning": f"A brand built around the essence of {keyword}.",
            "memorability_score": 7,
            "style": b[1],
            "tagline": f"{keyword.capitalize()} — reimagined.",
            "available": None,
            "price_inr": 999,
        }
        for b in bases
    ]
