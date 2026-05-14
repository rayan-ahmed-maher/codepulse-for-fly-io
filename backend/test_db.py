import sys
sys.path.insert(0, '.')
from core.supabase_client import get_supabase
db = get_supabase()
result = db.table('deployments').select('*').execute()
print('Total rows:', len(result.data))
print('Data:', result.data)