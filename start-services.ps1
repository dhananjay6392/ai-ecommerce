# IntelliCart AI — Native Local Startup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Starting IntelliCart AI Full-Stack Platform            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check MongoDB
$mongo = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongo -and $mongo.Status -eq "Running") {
    Write-Host "[OK] MongoDB is running locally." -ForegroundColor Green
} else {
    Write-Host "[WARN] MongoDB service not detected as running. Starting if available..." -ForegroundColor Yellow
    Start-Service -Name MongoDB -ErrorAction SilentlyContinue
}

# 2. Start ML Microservice (FastAPI)
Write-Host "[1/3] Launching Python FastAPI Machine Learning Engine (Port 8000)..." -ForegroundColor Yellow
$pyExe = "C:\Users\vivek\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if (-not (Test-Path $pyExe)) {
    $pyExe = "python"
}
Start-Process -FilePath $pyExe -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" -WorkingDirectory "$PSScriptRoot\ml-service" -WindowStyle Minimized

# 3. Start Express Backend
Write-Host "[2/3] Launching Node.js Express REST Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "$PSScriptRoot\backend" -WindowStyle Minimized

# 4. Start Vite Frontend
Write-Host "[3/3] Launching React Vite Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory "$PSScriptRoot\frontend" -WindowStyle Minimized

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   All Services Launched Successfully!                    " -ForegroundColor Green
Write-Host "   • Web App:     http://localhost:5173                   " -ForegroundColor White
Write-Host "   • REST API:    http://localhost:5000/api/health        " -ForegroundColor White
Write-Host "   • ML Engine:   http://localhost:8000/ml/health         " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
