#!/bin/bash
# Ensure log directory exists
mkdir -p outputs/logs

# Start Supervisor
echo "Starting Supervisor for Attendance Service..."
# Fix for WSL /mnt/c filesystem permissions
export UV_LINK_MODE=copy

# CRITICAL FIX: Create the virtual environment inside Linux (HOME dir) 
# instead of on the Windows mounted drive (/mnt/c).
# This prevents "Operation not permitted" errors during installation.
export UV_PROJECT_ENVIRONMENT=$HOME/.venvs/attendance-service

# Ensure dependencies are installed in that valid Linux location
echo "Installing dependencies to Linux environment: $UV_PROJECT_ENVIRONMENT..."
uv sync

# Run supervisor using the safe Linux environment
uv run supervisord -c supervisord.conf
