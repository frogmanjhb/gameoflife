# Windows PowerShell Setup Script for Local Development
# Run this script: .\setup-local.ps1

Write-Host "🚀 Setting up local development environment..." -ForegroundColor Green

# Check Node.js
Write-Host "`n📦 Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($nodeVersion) {
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm run install:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Create .env file if it doesn't exist
Write-Host "`n⚙️  Setting up environment variables..." -ForegroundColor Yellow
if (-not (Test-Path "server\.env")) {
    Copy-Item "server\env.example" "server\.env"
    Write-Host "✅ Created server/.env file" -ForegroundColor Green
    Write-Host "⚠️  Please edit server/.env and set your JWT_SECRET and database settings" -ForegroundColor Yellow
} else {
    Write-Host "✅ server/.env already exists" -ForegroundColor Green
}

# Check if PostgreSQL is available
Write-Host "`n🗄️  Checking database setup..." -ForegroundColor Yellow
$pgAvailable = Get-Command psql -ErrorAction SilentlyContinue
if ($pgAvailable) {
    Write-Host "✅ PostgreSQL found. You can use PostgreSQL for local development." -ForegroundColor Green
    Write-Host "   Set DATABASE_URL in server/.env to use PostgreSQL" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  PostgreSQL not found. Using SQLite for local development." -ForegroundColor Cyan
    Write-Host "   Install PostgreSQL if you want production-like setup." -ForegroundColor Cyan
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Edit server/.env and configure your settings" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "`nDefault credentials:" -ForegroundColor Yellow
Write-Host "  Teacher: teacher1 / teacher123" -ForegroundColor White
Write-Host "  Student: student1 / student123" -ForegroundColor White

