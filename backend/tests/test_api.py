def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Email Agent API is running"}

def test_load_inbox(client):
    response = client.post("/inbox/load")
    if response.status_code != 200:
        print(f"Load Inbox Failed: {response.text}")
    assert response.status_code == 200
    assert response.json()["message"] == "Inbox loaded successfully"

def test_get_emails(client):
    # First load data
    client.post("/inbox/load")
    
    response = client.get("/inbox/")
    if response.status_code != 200:
        print(f"Get Emails Failed: {response.text}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "subject" in data[0]

def test_agent_chat(client):
    # Load data for context
    client.post("/inbox/load")
    
    payload = {
        "query": "What is in my inbox?",
        "email_id": None
    }
    response = client.post("/agent/chat", json=payload)
    if response.status_code != 200:
        print(f"Agent Chat Failed: {response.text}")
    assert response.status_code == 200
    assert "response" in response.json()
    assert isinstance(response.json()["response"], str)
