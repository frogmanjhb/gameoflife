#!/bin/bash
set -e

echo "🚀 Starting Game of Life Server..."

# Change to server directory
cd server

# Start the server
exec npm start
