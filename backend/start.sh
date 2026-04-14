#!/bin/bash
set -e

cd "$(dirname "$0")"

# Install dependencies if needed
pip install -r requirements.txt -q

# Run the FastAPI server
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8080}" --reload
