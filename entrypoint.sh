#!/bin/sh
PORT="${PORT:-8999}"
echo "Starting Faith-OS backend on port $PORT..."
exec python -m uvicorn faith_os:app --host 0.0.0.0 --port "$PORT"
