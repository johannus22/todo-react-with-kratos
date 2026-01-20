# PowerShell setup script for Ory Kratos with Docker

Write-Host "Setting up Ory Kratos with Docker..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "VITE_ORY_URL=http://localhost:4433" | Out-File -FilePath .env -Encoding utf8
    Write-Host "Created .env file with VITE_ORY_URL=http://localhost:4433" -ForegroundColor Green
} else {
    Write-Host ".env file already exists. Make sure it contains:" -ForegroundColor Yellow
    Write-Host "   VITE_ORY_URL=http://localhost:4433" -ForegroundColor Yellow
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Start Docker Compose
Write-Host "Starting Ory Kratos with Docker Compose..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if services are running
$services = docker-compose ps
if ($services -match "kratos.*Up") {
    Write-Host "Ory Kratos is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    Write-Host "   - Public API: http://localhost:4433"
    Write-Host "   - Admin API: http://localhost:4434"
    Write-Host "   - Database: localhost:5432"
    Write-Host ""
    Write-Host "Test the setup:" -ForegroundColor Cyan
    Write-Host "   curl http://localhost:4433/health/ready"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Make sure VITE_ORY_URL=http://localhost:4433 is in your .env file"
    Write-Host "   2. Start your React app: npm run dev"
    Write-Host "   3. Open http://localhost:5173 and try registering a user"
} else {
    Write-Host "Failed to start services. Check logs with: docker-compose logs" -ForegroundColor Red
    exit 1
}
