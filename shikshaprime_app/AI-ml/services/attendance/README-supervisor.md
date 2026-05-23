# Managing Attendance Service with Supervisor

Your attendance service is now managed by **Supervisor**. This ensures it runs in the background and restarts automatically if it crashes.

> [!NOTE]
> `supervisor` is designed for Unix-like systems (Linux/MacOS). The instructions below apply if you are using WSL or deploying to a Linux server.

## 🔄 Workflow Cheatsheet

Think of **Supervisor** as the "Manager" and your **Backend** as the "Worker".

### 1. Manage the Manager (Supervisor)
*The Manager must be running for anything else to work.*

> **WSL Users:** Run `source setup_wsl.sh` first to avoid permission errors!

-   **Start Manager**: `./start_attendance.sh`
-   **Stop Manager** (Kills everything): `uv run supervisorctl -c supervisord.conf shutdown`

### 2. Manage the Worker (Backend)
*Use these to restart your app without killing the Manager.*

-   **Check Status**: `uv run supervisorctl -c supervisord.conf status`
-   **Stop App**: `uv run supervisorctl -c supervisord.conf stop attendance-service`
-   **Start App**: `uv run supervisorctl -c supervisord.conf start attendance-service`
-   **Restart App** (After code changes): `uv run supervisorctl -c supervisord.conf restart attendance-service`

## Quick Start

**Start the Backend:**
```bash
cd ShikshaPrime/AI-ml/services/attendance
bash start_attendance.sh
```

## Configuration

**Changing the Port:**
1.  Open `supervisord.conf`.
2.  Find the line: `command=uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`
3.  Change `8000` to your desired port (e.g., `8001`).
4.  Restart the backend:
    ```bash
    uv run supervisorctl -c supervisord.conf restart attendance-service
    ```

## Common Commands

Run these commands from the `services/attendance` directory:

**Check Status (Is it running?):**
```bash
uv run supervisorctl -c supervisord.conf status
```
*Output should show `RUNNING`.*

**Verify API Response:**
```bash
curl http://localhost:8000/
```
*(Replace `8000` with your new port if you changed it)*

**Restart Backend:**
```bash
uv run supervisorctl -c supervisord.conf restart attendance-service
```

**Stop Backend:**
```bash
uv run supervisorctl -c supervisord.conf stop attendance-service
```

**Shut Down Supervisor (Stops everything):**
```bash
uv run supervisorctl -c supervisord.conf shutdown
```

## Logs

- **Output Log**: `outputs/logs/attendance.out.log` (Standard output)
- **Error Log**: `outputs/logs/attendance.err.log` (Errors)
