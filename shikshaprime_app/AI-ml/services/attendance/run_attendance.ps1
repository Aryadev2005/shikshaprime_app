# Run Attendance Service
Write-Host "Starting Attendance Service..."
Set-Location $PSScriptRoot

# Run with uv (which handles venv automatically)
# This ensures we run from the correct directory (services/attendance)
# so that 'app.main' resolves correctly.
uv run -m uvicorn app.main:app --reload --port 8000
