#!/bin/bash
set -e

# TestBot Setup Script for Parse Server
# This script starts Parse Server and MongoDB, then creates sample data

cd "$(dirname "$0")"

echo "Starting Parse Server and MongoDB..."
docker compose up -d

echo "Waiting for services to be ready..."
sleep 15

# Wait for Parse Server health check
max_attempts=30
attempt=0
until curl -f http://localhost:1337/parse/health > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "Failed to connect to Parse Server after $max_attempts attempts"
    exit 1
  fi
  echo "Waiting for Parse Server... (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "Parse Server is ready!"

# API configuration
API_BASE="http://localhost:1337/parse"
APP_ID="TestBotAppId"
MASTER_KEY="TestBotMasterKey123"

echo "Creating sample users..."

# Create user 1
USER1_RESPONSE=$(curl -s -X POST "$API_BASE/users" \
  -H "X-Parse-Application-Id: $APP_ID" \
  -H "X-Parse-Master-Key: $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "password": "TestPass123!",
    "email": "testuser1@example.com"
  }')

USER1_ID=$(echo "$USER1_RESPONSE" | jq -r '.objectId')
echo "Created user: testuser1 (ID: $USER1_ID)"

# Create user 2
USER2_RESPONSE=$(curl -s -X POST "$API_BASE/users" \
  -H "X-Parse-Application-Id: $APP_ID" \
  -H "X-Parse-Master-Key: $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "password": "TestPass123!",
    "email": "testuser2@example.com"
  }')

USER2_ID=$(echo "$USER2_RESPONSE" | jq -r '.objectId')
echo "Created user: testuser2 (ID: $USER2_ID)"

echo "Creating sample todo items..."

# Create TodoList items for user 1
curl -s -X POST "$API_BASE/classes/TodoList" \
  -H "X-Parse-Application-Id: $APP_ID" \
  -H "X-Parse-Master-Key: $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Complete Parse Server integration\",
    \"description\": \"Integrate Parse Server with our application\",
    \"completed\": false,
    \"priority\": \"high\",
    \"dueDate\": {
      \"__type\": \"Date\",
      \"iso\": \"$(date -u -v+7d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d '+7 days' +"%Y-%m-%dT%H:%M:%S.000Z")\"
    },
    \"owner\": {
      \"__type\": \"Pointer\",
      \"className\": \"_User\",
      \"objectId\": \"$USER1_ID\"
    }
  }" > /dev/null

curl -s -X POST "$API_BASE/classes/TodoList" \
  -H "X-Parse-Application-Id: $APP_ID" \
  -H "X-Parse-Master-Key: $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Write API documentation\",
    \"description\": \"Document all REST endpoints\",
    \"completed\": true,
    \"priority\": \"medium\",
    \"dueDate\": {
      \"__type\": \"Date\",
      \"iso\": \"$(date -u -v-2d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d '-2 days' +"%Y-%m-%dT%H:%M:%S.000Z")\"
    },
    \"owner\": {
      \"__type\": \"Pointer\",
      \"className\": \"_User\",
      \"objectId\": \"$USER1_ID\"
    }
  }" > /dev/null

curl -s -X POST "$API_BASE/classes/TodoList" \
  -H "X-Parse-Application-Id: $APP_ID" \
  -H "X-Parse-Master-Key: $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Review pull requests\",
    \"description\": \"Review and merge pending PRs\",
    \"completed\": false,
    \"priority\": \"high\",
    \"dueDate\": {
      \"__type\": \"Date\",
      \"iso\": \"$(date -u -v+1d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d '+1 day' +"%Y-%m-%dT%H:%M:%S.000Z")\"
    },
    \"owner\": {
      \"__type\": \"Pointer\",
      \"className\": \"_User\",
      \"objectId\": \"$USER1_ID\"
    }
  }" > /dev/null

# Create TodoList items for user 2
curl -s -X POST "$API_BASE/classes/TodoList" \
  -H "X-Parse-Application-Id: $APP_ID" \
  -H "X-Parse-Master-Key: $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Setup CI/CD pipeline\",
    \"description\": \"Configure automated testing and deployment\",
    \"completed\": false,
    \"priority\": \"medium\",
    \"dueDate\": {
      \"__type\": \"Date\",
      \"iso\": \"$(date -u -v+14d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d '+14 days' +"%Y-%m-%dT%H:%M:%S.000Z")\"
    },
    \"owner\": {
      \"__type\": \"Pointer\",
      \"className\": \"_User\",
      \"objectId\": \"$USER2_ID\"
    }
  }" > /dev/null

curl -s -X POST "$API_BASE/classes/TodoList" \
  -H "X-Parse-Application-Id: $APP_ID" \
  -H "X-Parse-Master-Key: $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Update dependencies\",
    \"description\": \"Update npm packages to latest versions\",
    \"completed\": true,
    \"priority\": \"low\",
    \"dueDate\": {
      \"__type\": \"Date\",
      \"iso\": \"$(date -u -v-5d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d '-5 days' +"%Y-%m-%dT%H:%M:%S.000Z")\"
    },
    \"owner\": {
      \"__type\": \"Pointer\",
      \"className\": \"_User\",
      \"objectId\": \"$USER2_ID\"
    }
  }" > /dev/null

echo "✓ Parse Server setup complete"
echo "API endpoint: http://localhost:1337/parse"
echo "GraphQL endpoint: http://localhost:1337/graphql"
echo "Health check: http://localhost:1337/parse/health"
echo ""
echo "Test users:"
echo "  - testuser1 / TestPass123!"
echo "  - testuser2 / TestPass123!"
