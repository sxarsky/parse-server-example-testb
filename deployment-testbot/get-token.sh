#!/bin/bash
# Return Parse Server Master Key for TestBot
#
# Note: Using Master Key instead of session token because Parse Server
# requires dual-header authentication (X-Parse-Application-Id + auth token).
# TestBot currently supports single-token auth, so we use Master Key which
# provides admin-level access and bypasses user session requirements.
#
# See deployment-testbot/AUTH-CONFIGURATION.md for details.

echo "TestBotMasterKey123"
