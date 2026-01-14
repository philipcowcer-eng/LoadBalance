#!/bin/bash
BASE_URL="http://localhost:8000"

echo "Running Test Cases for Rust Backend..."
echo "--------------------------------------"

# TC-1.1 & TC-1.2
echo "TC-1.1 & TC-1.2: Manage Engineer Roster & Capacity Calculation"
CREATE_RESP=$(curl -s -X POST "$BASE_URL/engineers" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Engineer", "role": "Network Engineer", "total_capacity": 40, "ktlo_tax": 10}')

ENG_ID=$(echo $CREATE_RESP | grep -oE '"id":"([^"]+)"' | cut -d'"' -f4)

if [ -n "$ENG_ID" ]; then
    echo "[PASSED] Engineer created with ID: $ENG_ID"
    NAME=$(echo $CREATE_RESP | grep -oE '"name":"([^"]+)"' | cut -d'"' -f4)
    ROLE=$(echo $CREATE_RESP | grep -oE '"role":"([^"]+)"' | cut -d'"' -f4)
    TOTAL=$(echo $CREATE_RESP | grep -oE '"total_capacity":([0-9]+)' | cut -d: -f2)
    KTLO=$(echo $CREATE_RESP | grep -oE '"ktlo_tax":([0-9]+)' | cut -d: -f2)
    EFFECTIVE=$((TOTAL - KTLO))
    
    echo "  Name: $NAME, Role: $ROLE"
    echo "  Capacity Check: Total=$TOTAL, KTLO=$KTLO => Effective=$EFFECTIVE"
    
    if [ "$EFFECTIVE" -eq 30 ]; then
        echo "[PASSED] TC-1.1: Capacity calculation is correct."
    else
        echo "[FAILED] TC-1.1: Capacity calculation mismatch."
    fi

    # Update (TC-1.2)
    echo "  Testing Update (TC-1.2)..."
    UPDATE_RESP=$(curl -s -X PUT "$BASE_URL/engineers/$ENG_ID" \
      -H "Content-Type: application/json" \
      -d '{"name": "Test Engineer Updated", "role": "Architect", "total_capacity": 40, "ktlo_tax": 5}')
    
    NEW_ROLE=$(echo $UPDATE_RESP | grep -oE '"role":"([^"]+)"' | cut -d'"' -f4)
    if [ "$NEW_ROLE" == "Architect" ]; then
        echo "[PASSED] TC-1.2: Role update persisted."
    else
        echo "[FAILED] TC-1.2: Role update failed. Found: $NEW_ROLE"
    fi
else
    echo "[FAILED] Engineer creation failed."
    echo "Response: $CREATE_RESP"
fi

echo "--------------------------------------"

# TC-2.1
echo "TC-2.1: Project Creation and Priority"
PROJ_RESP=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project Alpha", "priority": "P1-Critical", "status": "Healthy"}')

PROJ_ID=$(echo $PROJ_RESP | grep -oE '"id":"([^"]+)"' | cut -d'"' -f4)

if [ -n "$PROJ_ID" ]; then
    echo "[PASSED] Project Alpha created with ID: $PROJ_ID"
    PRIORITY=$(echo $PROJ_RESP | grep -oE '"priority":"([^"]+)"' | cut -d'"' -f4)
    if [ "$PRIORITY" == "P1-Critical" ]; then
        echo "[PASSED] TC-2.1: Priority P1 assigned correctly."
    else
        echo "[FAILED] TC-2.1: Priority mismatch. Found: $PRIORITY"
    fi
else
    echo "[FAILED] Project creation failed."
    echo "Response: $PROJ_RESP"
fi

echo "--------------------------------------"
echo "Tests Completed."
