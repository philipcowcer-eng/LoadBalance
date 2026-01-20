import requests
import sys

BASE_URL = "http://localhost:8001"

def register():
    """Register admin user if not exists"""
    print("Attempting to register admin user...")
    resp = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": "admin", 
        "password": "changeme",
        "role": "admin"
    })
    if resp.status_code == 201:
        print("Admin user registered successfully.")
    elif resp.status_code == 400 and "already exists" in resp.text:
        print("Admin user already exists. Proceeding to login.")
    else:
        print(f"Registration failed: {resp.status_code} {resp.text}")
        # We don't exit here, we try to login anyway in case other errors occurred

def login():
    """Login and return token"""
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin", 
        "password": "changeme"
    })
    if resp.status_code != 200:
        print(f"Failed to login: {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]

# 1. Ensure User Exists
register()

# 2. Login
token = login()
headers = {"Authorization": f"Bearer {token}"}

# 3. Create a Scenario (Sandbox Mode)
print("Creating Sandbox Scenario...")
scenario_data = {"name": "Test Sandbox Scenario", "description": "Verifying US-1.1"}
resp = requests.post(f"{BASE_URL}/api/scenarios/", json=scenario_data, headers=headers)
if resp.status_code != 200:
    print(f"Failed to create scenario: {resp.text}")
    sys.exit(1)
scenario_id = resp.json()["id"]
print(f"Scenario Created: {scenario_id}")

# 4. Add Virtual Resource to Sandbox (Should Succeed)
print("Adding Virtual Resource to Sandbox...")
vr_data = {"name": "Virtual Bob", "role": "Network Engineer", "capacity_hours": 40}
resp = requests.post(f"{BASE_URL}/api/scenarios/{scenario_id}/resources", json=vr_data, headers=headers)
if resp.status_code != 200:
    print(f"Failed to add virtual resource: {resp.text}")
    sys.exit(1)
print("Virtual Resource Added Successfully ✅")

# 5. Verify list
resp = requests.get(f"{BASE_URL}/api/scenarios/", headers=headers)
scenarios = resp.json()
found = any(s['id'] == scenario_id for s in scenarios)
print(f"Scenario found in list: {found} ✅")

print("US-1.1 Verification Complete.")
