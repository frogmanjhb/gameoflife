#!/bin/bash
set -e

echo "🚀 Starting CivicLab Server..."

# Change to server directory
cd server

# Start the server
exec npm start
