
import requests
import unittest
import json
import time

import os

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8001/api")

class TestResourceManagerAPI(unittest.TestCase):
    def setUp(self):
        # Clean up or ensure clean state if possible, but for now we just create new entities
        pass

    def test_01_engineer_lifecycle(self):
        print("\nTesting Engineer Lifecycle...")
        # Create
        payload = {
            "name": "Test Eng Python",
            "role": "Network Engineer",
            "total_capacity": 40,
            "ktlo_tax": 10
        }
        res = requests.post(f"{BASE_URL}/engineers", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["name"], payload["name"])
        self.assertEqual(data["effective_capacity"], 30)
        eng_id = data["id"]
        print(f"Created Engineer: {eng_id}")

        # Get
        res = requests.get(f"{BASE_URL}/engineers/{eng_id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], eng_id)

        # Update
        update_payload = {
            "name": "Test Eng Python Updated",
            "role": "Architect",
            "total_capacity": 40,
            "ktlo_tax": 5
        }
        res = requests.put(f"{BASE_URL}/engineers/{eng_id}", json=update_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "Architect")
        self.assertEqual(data["effective_capacity"], 35)
        print("Engineer Update Verified")

    def test_02_project_lifecycle_epic11(self):
        print("\nTesting Project Lifecycle (Epic 11)...")
        # Create Project
        payload = {
            "name": "Epic 11 Test Project",
            "priority": "P2-Strategic",
            "status": "Healthy"
        }
        res = requests.post(f"{BASE_URL}/projects", json=payload)
        self.assertEqual(res.status_code, 200, f"Create Failed: {res.text}")
        project = res.json()
        project_id = project["id"]
        print(f"Created Project: {project_id}")

        # PATCH Project (Partial Update)
        patch_payload = {
            "rag_status": "Amber",
            "percent_complete": 50,
            "business_justification": "Testing patch"
        }
        res = requests.patch(f"{BASE_URL}/projects/{project_id}", json=patch_payload)
        self.assertEqual(res.status_code, 200, f"PATCH Failed: {res.text}")
        updated = res.json()
        self.assertEqual(updated["rag_status"], "Amber")
        self.assertEqual(updated["percent_complete"], 50)
        print("Project PATCH Verified")

        # Verify Impact Log for Patch
        res = requests.get(f"{BASE_URL}/projects/{project_id}/impact-log")
        self.assertEqual(res.status_code, 200)
        logs = res.json()
        self.assertTrue(len(logs) > 0)
        print(f"Impact Log Verified: {logs[0]['event']}")

        # Create RID Log (Risk)
        rid_payload = {
            "type": "Risk",
            "description": "Potential delay due to resources",
            "severity": "High",
            "owner": "PM"
        }
        res = requests.post(f"{BASE_URL}/projects/{project_id}/rid-log", json=rid_payload)
        self.assertEqual(res.status_code, 200, f"RID Create Failed: {res.text}")
        rid = res.json()
        self.assertEqual(rid["type"], "Risk")
        print("RID Log Creation Verified")

        # Verify RID Log List
        res = requests.get(f"{BASE_URL}/projects/{project_id}/rid-log")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.json()) > 0)

    def test_03_allocations(self):
        print("\nTesting Allocations...")
        # Setup: Need an Engineer and a Project
        eng_res = requests.post(f"{BASE_URL}/engineers", json={"name": "Alloc Eng", "role": "Wireless Engineer", "total_capacity": 40})
        eng_id = eng_res.json()["id"]

        proj_res = requests.post(f"{BASE_URL}/projects", json={"name": "Alloc Proj", "priority": "P3-Standard", "status": "Healthy"})
        proj_id = proj_res.json()["id"]

        # Create Allocation
        alloc_payload = {
            "engineer_id": eng_id,
            "role": "Lead",
            "hours_per_week": 20
        }
        res = requests.post(f"{BASE_URL}/projects/{proj_id}/allocations", json=alloc_payload)
        if res.status_code != 200:
            print(f"Allocation Failed: {res.text}")
        self.assertEqual(res.status_code, 200)
        alloc = res.json()
        self.assertEqual(alloc["hours"], 20)
        alloc_id = alloc["id"]
        print("Allocation Created")

        # Update Allocation
        res = requests.patch(f"{BASE_URL}/allocations/{alloc_id}", json={"hours_per_week": 25})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["hours"], 25)
        print("Allocation Updated")

        # Verify Impact Log on Project
        res = requests.get(f"{BASE_URL}/projects/{proj_id}/impact-log")
        logs = res.json()
        self.assertTrue(any("Allocation Updated" in l["event"] for l in logs))

        # Delete Allocation
        res = requests.delete(f"{BASE_URL}/allocations/{alloc_id}")
        self.assertEqual(res.status_code, 200)
        print("Allocation Deleted")

if __name__ == "__main__":
    unittest.main()
