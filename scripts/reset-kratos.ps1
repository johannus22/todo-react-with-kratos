$ErrorActionPreference = "Stop"

$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

Write-Host "Resetting Kratos database volume..." -ForegroundColor Cyan
docker-compose down

$kratosVolumes = docker volume ls -q --filter name=kratos-db-data
if ($kratosVolumes) {
  docker volume rm $kratosVolumes
}

Write-Host "Starting Kratos services..." -ForegroundColor Cyan
docker-compose up -d kratos-db kratos-migrate kratos

$readyUrl = "http://localhost:4434/health/ready"
Write-Host "Waiting for Kratos admin API..." -ForegroundColor Cyan
for ($i = 0; $i -lt 30; $i++) {
  try {
    $resp = Invoke-WebRequest -Uri $readyUrl -TimeoutSec 2
    if ($resp.StatusCode -eq 200) { break }
  } catch {
    Start-Sleep -Seconds 2
  }
}

$identityPath = Join-Path $repoRoot "kratos\\admin.identity.json"
if (-not (Test-Path $identityPath)) {
  throw "Admin identity JSON not found at $identityPath"
}

Write-Host "Seeding admin identity (admin@todo.app)..." -ForegroundColor Cyan
$body = Get-Content -Raw -Path $identityPath
try {
  Invoke-RestMethod -Method Post -Uri "http://localhost:4434/admin/identities" -ContentType "application/json" -Body $body | Out-Null
  Write-Host "Admin identity created." -ForegroundColor Green
} catch {
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 409) {
    Write-Host "Admin identity already exists. Skipping create." -ForegroundColor Yellow
  } else {
    throw
  }
}

Write-Host "Done. Admin login: admin@todo.app / admin123!" -ForegroundColor Green
