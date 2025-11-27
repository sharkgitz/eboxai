import sys
sys.path.insert(0, '.')
from backend.database import SessionLocal
from backend.services import inbox_service

db = SessionLocal()
try:
    inbox_service.load_mock_data(db)
    print('SUCCESS: Mock data loaded')
except Exception as e:
    print(f'ERROR: {e}')
    import traceback
    traceback.print_exc()
