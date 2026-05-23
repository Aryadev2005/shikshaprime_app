#!/bin/bash
# source this file to set up your environment for manual commands
# Usage: source setup_wsl.sh

echo "Configuring environment for WSL..."

# Force uv to use the Linux Home directory for the virtual environment
# This avoids "Operation not permitted" errors on the Windows C: drive
export UV_PROJECT_ENVIRONMENT=$HOME/.venvs/attendance-service
export UV_LINK_MODE=copy

echo "Environment Configured!"
echo "You can now run manual commands like:"
echo "  uv run supervisorctl -c supervisord.conf status"
