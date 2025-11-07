#!/bin/bash

# Playwright test runner with custom TMPDIR to avoid /tmp permission issues
# This is required in the Claude Code environment where /tmp has permission restrictions

# Create custom temp directory if it doesn't exist
mkdir -p /home/user/fm-wallet-info/.tmp

# Set all temp directory environment variables
export TMPDIR=/home/user/fm-wallet-info/.tmp
export TMP=/home/user/fm-wallet-info/.tmp
export TEMP=/home/user/fm-wallet-info/.tmp

# Run Playwright with all arguments passed through
npx playwright "$@"
