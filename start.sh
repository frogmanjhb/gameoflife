#!/bin/bash

echo "🎮 Starting Game of Life Classroom Simulation..."
echo

echo "📦 Installing dependencies..."
npm run install:all

echo
echo "🚀 Starting development servers..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo

npm run dev
