# Parse Server Authentication Configuration for TestBot

## Issue Summary

Parse Server uses a **dual-header authentication model** that differs from typical REST APIs:

```bash
# Required headers for ALL Parse Server requests:
X-Parse-Application-Id: TestBotAppId    # Public application identifier
X-Parse-Session-Token: <session_token>  # User session (from login)
# OR
X-Parse-Master-Key: TestBotMasterKey123 # Admin access
```

## Current TestBot Limitation

TestBot's `auth_token_command` returns a **single token** (session token), but Parse Server requires **two headers**:
1. Application ID (always required)
2. Session Token OR Master Key (for authentication)

### Test Failures

All generated tests fail with HTTP 403 because:
- **Integration tests**: X-Parse-Application-Id header is empty string
- **Fuzz/Contract tests**: SKYRAMP_TEST_TOKEN (session token) incorrectly used as Application ID

## Solution Options

### Option 1: Use Master Key for Tests (Recommended for Now)

Modify `get-token.sh` to return the Master Key instead of session token:

```bash
#!/bin/bash
# Return Master Key for admin-level test access
echo "TestBotMasterKey123"
```

**Pros:**
- Simple one-line change
- Tests have full access to all operations
- Bypasses user-level auth complexity

**Cons:**
- Less realistic (doesn't test user-level permissions)
- Tests run with admin privileges

### Option 2: Enhanced TestBot Multi-Header Support (Future)

TestBot should support configuration like:

```yaml
# testbot-config.yaml
authentication:
  type: multi-header
  headers:
    - name: X-Parse-Application-Id
      value: TestBotAppId
    - name: X-Parse-Session-Token
      value: ${SKYRAMP_TEST_TOKEN}
```

This requires TestBot enhancement to handle multiple auth headers.

### Option 3: Wrapper Endpoint (Complex)

Create a proxy endpoint that handles Parse Server's auth and exposes a simpler auth model.

## Current Configuration

### Setup Files
- `docker-compose.yml`: Defines `PARSE_SERVER_APPLICATION_ID=TestBotAppId`
- `setup.sh`: Uses APP_ID="TestBotAppId" for sample data creation
- `get-token.sh`: Returns session token for testuser1

### Configuration Files Created
- `testbot-config.yaml`: Documents required auth headers (not yet used by TestBot)
- `.env.testbot`: Environment variables for Parse Server config

## Recommended Fix

**For immediate testing**, update `get-token.sh` to return Master Key:

```bash
# deployment-testbot/get-token.sh
#!/bin/bash
echo "TestBotMasterKey123"
```

Then update tests to use `X-Parse-Master-Key` header instead of `X-Parse-Session-Token`.

## Long-term Solution

TestBot should be enhanced to support Parse Server's authentication model natively, allowing configuration of multiple required headers.

## Testing Manually

To verify auth works correctly:

```bash
# With Application ID + Session Token (user-level)
curl http://localhost:1337/parse/users/me \
  -H "X-Parse-Application-Id: TestBotAppId" \
  -H "X-Parse-Session-Token: r:abc123..."

# With Application ID + Master Key (admin-level)
curl http://localhost:1337/parse/classes/TodoList \
  -H "X-Parse-Application-Id: TestBotAppId" \
  -H "X-Parse-Master-Key: TestBotMasterKey123"
```

Both headers are **always required**. The Application ID is public, the session token/master key is private.
