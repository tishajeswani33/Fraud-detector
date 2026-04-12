$venvPath = "..\..\..\.venv\Scripts\python.exe"
if (Test-Path $venvPath) {
    Write-Host "Starting FraudShield Full Stack (Backend + Static Frontend) on port 3000..." -ForegroundColor Cyan
    & $venvPath -m uvicorn main:app --reload --port 3000
} else {
    Write-Host "Virtual environment not found at $venvPath. Attempting global python..." -ForegroundColor Yellow
    python -m uvicorn main:app --reload --port 3000
}
