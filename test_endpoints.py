import requests
import json

BASE_URL = "http://localhost:8004"

def test_endpoint(endpoint):
    try:
        response = requests.get(f"{BASE_URL}/{endpoint}")
        print(f"--- {endpoint} ---")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Count: {len(data)}")
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error testing {endpoint}: {e}")

if __name__ == "__main__":
    test_endpoint("meetings")
    test_endpoint("followups")
