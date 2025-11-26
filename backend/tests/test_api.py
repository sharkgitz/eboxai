from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Email Agent API is running"}

def test_load_inbox():
    response = client.post("/inbox/load")
    assert response.status_code == 200
    assert response.json() == {"message": "Inbox loaded successfully"}

def test_get_emails():
    # Ensure inbox is loaded first
    client.post("/inbox/load")
    response = client.get("/inbox/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0

def test_get_prompts():
    response = client.get("/prompts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
