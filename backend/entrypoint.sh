#!/bin/bash
# filepath: c:\Nam_Projects\AI_Learning\laptop_recommendation_system\backend\entrypoint.sh

# Chờ cho PostgreSQL khởi động
echo "Waiting for PostgreSQL to start..."
sleep 10

# Chạy migration
echo "Running database migration..."
python migration.py || echo "Migration failed but continuing..."

# Khởi động Flask application
echo "Starting Flask application..."
exec python main.py