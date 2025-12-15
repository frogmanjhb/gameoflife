#!/bin/bash
# Linux/Mac Setup Script for Local Development
# Run this script: chmod +x setup-local.sh && ./setup-local.sh

echo "🚀 Setting up local development environment..."

# Check Node.js
echo ""
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
else
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm run install:all
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"

# Create .env file if it doesn't exist
echo ""
echo "⚙️  Setting up environment variables..."
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env file"
    echo "⚠️  Please edit server/.env and set your JWT_SECRET and database settings"
else
    echo "✅ server/.env already exists"
fi

# Check if PostgreSQL is available
echo ""
echo "🗄️  Checking database setup..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL found. You can use PostgreSQL for local development."
    echo "   Set DATABASE_URL in server/.env to use PostgreSQL"
else
    echo "ℹ️  PostgreSQL not found. Using SQLite for local development."
    echo "   Install PostgreSQL if you want production-like setup."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env and configure your settings"
echo "2. Run: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Default credentials:"
echo "  Teacher: teacher1 / teacher123"
echo "  Student: student1 / student123"

