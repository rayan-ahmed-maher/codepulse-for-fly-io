"""
Supabase persistence diagnostic test -- ASCII only, Windows cp1252 safe.
Run from backend/ directory: python test_persist.py
"""
import asyncio, sys, uuid
sys.path.insert(0, ".")

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from core.supabase_client import get_supabase
from core.state import deployment_store

SEP = "-" * 60

def section(title):
    print(f"\n{SEP}\n  {title}\n{SEP}", flush=True)

def ok(msg):    print(f"  [PASS] {msg}", flush=True)
def fail(msg):  print(f"  [FAIL] {msg}", flush=True)
def info(msg):  print(f"  {msg}", flush=True)

async def test():
    section("Test 0 -- Credential check")
    from core.config import settings
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    info(f"SUPABASE_URL              = {url[:35] if url else '(EMPTY)'}")
    info(f"SUPABASE_SERVICE_ROLE_KEY = {key[:20] if key else '(EMPTY)'}...")
    info(f"has_supabase              = {settings.has_supabase}")
    if not settings.has_supabase:
        fail("FATAL: Supabase credentials not loaded.")
        return

    section("Test 1 -- get_supabase() client")
    sb = get_supabase()
    info(f"Client object: {type(sb).__name__ if sb else 'None'}")
    if sb is None:
        fail("FATAL: get_supabase() returned None")
        return
    ok("Client initialized")

    section("Test 2 -- READ deployments table + inspect schema")
    try:
        result = sb.table("deployments").select("*").limit(3).execute()
        ok(f"Read succeeded. Current rows: {len(result.data or [])}")
        if result.data:
            info(f"Column names in table: {list(result.data[0].keys())}")
    except Exception as e:
        fail(f"READ FAILED: {e}")
        return

    # Check id column type by trying a UUID insert
    section("Test 3 -- Probe: does id column accept UUID?")
    probe_uuid = str(uuid.uuid4())
    try:
        r = sb.table("deployments").insert({
            "id": probe_uuid, "project_name": "probe", "platform": "test",
            "status": "test", "user_id": "dev-user"
        }).execute()
        info(f"UUID insert result: {r.data}")
        ok("id column accepts UUID type")
        sb.table("deployments").delete().eq("id", probe_uuid).execute()
    except Exception as e:
        fail(f"UUID insert failed: {e}")

    section("Test 4 -- Probe: does tracking_id column exist?")
    probe_uuid2 = str(uuid.uuid4())
    try:
        r = sb.table("deployments").insert({
            "id": probe_uuid2, "tracking_id": "deploy_abc123",
            "project_name": "probe2", "platform": "test",
            "status": "test", "user_id": "dev-user"
        }).execute()
        info(f"tracking_id insert result: {r.data}")
        ok("tracking_id column EXISTS and accepts text")
        sb.table("deployments").delete().eq("id", probe_uuid2).execute()
    except Exception as e:
        fail(f"tracking_id column MISSING or insert failed: {e}")
        info("---> This column needs to be added via SQL in Supabase dashboard")

    section("Test 5 -- deployment_store.create() end-to-end")
    tracking_id = f"deploy_{uuid.uuid4().hex[:8]}"
    info(f"tracking_id = {tracking_id}")
    try:
        await deployment_store.create(tracking_id, {
            "project_name": "store-test-project",
            "platform":     "cloudflare",
            "status":       "PENDING",
            "user_id":      "dev-user",
        })
        ok("deployment_store.create() returned without exception")
    except Exception as e:
        fail(f"deployment_store.create() RAISED: {e}")

    # Check by tracking_id column
    try:
        check = sb.table("deployments").select("*").eq("tracking_id", tracking_id).execute()
        if check.data:
            ok(f"Row found via tracking_id column: {check.data[0]}")
        else:
            fail(f"Row NOT found via tracking_id after store.create()")
    except Exception as e:
        fail(f"Query by tracking_id failed: {e}")

    section("Summary -- All rows in deployments table")
    all_rows = sb.table("deployments").select("*").execute()
    info(f"Total rows: {len(all_rows.data or [])}")
    for row in (all_rows.data or []):
        info(f"  {row}")

    print(f"\n{'='*60}\n  All tests complete.\n{'='*60}\n", flush=True)

asyncio.run(test())
