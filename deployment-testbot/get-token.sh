#!/bin/bash
# Login with test user and return session token

API_BASE="http://localhost:1337/parse"
APP_ID="TestBotAppId"

# Login as testuser1
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/login" \
  -H "X-Parse-Application-Id: $APP_ID" \
  -H "X-Parse-Revocable-Session: 1" \
  -G \
  --data-urlencode "username=testuser1" \
  --data-urlencode "password=TestPass123!")

SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.sessionToken')

if [ "$SESSION_TOKEN" != "null" ] && [ -n "$SESSION_TOKEN" ]; then
  echo "$SESSION_TOKEN"
else
  # Fallback: try to get existing user session
  MASTER_KEY="TestBotMasterKey123"
  USER_RESPONSE=$(curl -s -X GET "$API_BASE/users" \
    -H "X-Parse-Application-Id: $APP_ID" \
    -H "X-Parse-Master-Key: $MASTER_KEY" \
    -G \
    --data-urlencode "where={\"username\":\"testuser1\"}")

  USER_ID=$(echo "$USER_RESPONSE" | jq -r '.results[0].objectId')
  SESSION_TOKEN=$(echo "$USER_RESPONSE" | jq -r '.results[0].sessionToken')

  if [ "$SESSION_TOKEN" != "null" ] && [ -n "$SESSION_TOKEN" ]; then
    echo "$SESSION_TOKEN"
  else
    echo "ERROR: Failed to get session token" >&2
    exit 1
  fi
fi
