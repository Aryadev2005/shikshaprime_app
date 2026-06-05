#!/bin/bash

# ===================================================
# Identity Service Phase 1 - Integration Tests
# ===================================================

BASE_URL="http://localhost:3001/api"
COLORS="\033[1;33m"
GREEN="\033[0;32m"
RED="\033[0;31m"
RESET="\033[0m"

# Test counters
PASSED=0
FAILED=0

# Helper functions
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local auth_header=$5
  
  echo -e "\n${COLORS}Testing: $name${RESET}"
  echo "  $method $endpoint"
  
  if [ -z "$data" ]; then
    RESPONSE=$(curl -s -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      ${auth_header:+-H "Authorization: $auth_header"})
  else
    RESPONSE=$(curl -s -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      ${auth_header:+-H "Authorization: $auth_header"} \
      -d "$data")
  fi
  
  STATUS=$(echo "$RESPONSE" | jq -r '.status' 2>/dev/null)
  MESSAGE=$(echo "$RESPONSE" | jq -r '.message' 2>/dev/null)
  
  if [ "$STATUS" == "1" ]; then
    echo -e "  ${GREEN}✓ PASSED${RESET}: $MESSAGE"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${RED}✗ FAILED${RESET}: $MESSAGE"
    echo "  Response: $RESPONSE"
    FAILED=$((FAILED + 1))
  fi
  
  # Return response for use in subsequent tests
  echo "$RESPONSE"
}

# ===================================================
# TESTS
# ===================================================

echo "========================================="
echo "Identity Service - Phase 1 Test Suite"
echo "========================================="

# 1. Health Check
test_endpoint "Health Check" "GET" "/health"

# 2. List Institutions (no filter)
test_endpoint "List All Institutions" "GET" "/institutions"

# 3. List Institutions (filter by type)
test_endpoint "List Institutions by Type (college)" "GET" "/institutions?type=college"

# 4. Validate Email (non-existent)
test_endpoint "Validate Email (not found)" "POST" "/auth/validate-email" \
  '{"email":"nonexistent@test.com"}'

# 5. Validate Email (existing) - assumes test data inserted
VALIDATE_RESP=$(test_endpoint "Validate Email (exists)" "POST" "/auth/validate-email" \
  '{"email":"teacher1@test.com"}')

# 6. Send OTP
OTP_RESP=$(test_endpoint "Send OTP" "POST" "/auth/send-otp" \
  '{"email":"teacher1@test.com"}')

# Extract OTP from console if available
# (In dev mode, OTP is logged to console, so you'd need to manually check logs)
echo -e "${COLORS}Note: Check console logs for OTP value${RESET}"

# For testing, we'll use a mock OTP - in real scenario, extract from logs
# 7. Verify OTP (wrong OTP first)
test_endpoint "Verify OTP (invalid)" "POST" "/auth/verify-otp" \
  '{"email":"teacher1@test.com","otp":"000000"}'

# 8. Login Success
LOGIN_RESP=$(test_endpoint "Login (success)" "POST" "/auth/login" \
  '{"username":"teacher1","password":"password123"}')

# Extract token from login response
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token' 2>/dev/null)

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo -e "  ${GREEN}Token obtained: ${TOKEN:0:20}...${RESET}"
  
  # 9. Get Profile (with valid token)
  test_endpoint "Get My Profile" "GET" "/profile/me" "" "Bearer $TOKEN"
  
  # 10. Get Profile (invalid token)
  test_endpoint "Get My Profile (invalid token)" "GET" "/profile/me" "" "Bearer invalid_token"
fi

# 11. Login Failed (wrong password)
test_endpoint "Login (wrong password)" "POST" "/auth/login" \
  '{"username":"teacher1","password":"wrongpassword"}'

# 12. Login Failed (non-existent user)
test_endpoint "Login (non-existent user)" "POST" "/auth/login" \
  '{"username":"nonexistent","password":"password123"}'

# ===================================================
# Summary
# ===================================================

echo -e "\n========================================="
echo -e "Test Results:"
echo -e "  ${GREEN}Passed: $PASSED${RESET}"
echo -e "  ${RED}Failed: $FAILED${RESET}"
echo -e "========================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${RESET}"
  exit 0
else
  echo -e "${RED}Some tests failed!${RESET}"
  exit 1
fi
