Write-Host "Starting NaviPRO Backend Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure you have:" -ForegroundColor Yellow
Write-Host "1. Python installed" -ForegroundColor White
Write-Host "2. .env file with your API keys" -ForegroundColor White
Write-Host "3. All dependencies installed" -ForegroundColor White
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found! Please install Python first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if .env file exists
if (Test-Path "backend\.env") {
    Write-Host ".env file found" -ForegroundColor Green
} else {
    Write-Host ".env file not found! Please create one with your API keys." -ForegroundColor Red
    Write-Host "Example .env file:" -ForegroundColor Yellow
    Write-Host "GROQ_API_KEY=your_groq_api_key_here" -ForegroundColor White
    Write-Host "GROQ_BASE_URL=https://api.groq.com/openai/v1" -ForegroundColor White
    Write-Host "YOUTUBE_API_KEY=your_youtube_api_key_here" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location backend
pip install -r requirements.txt

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
python agent_orchestra.py

Read-Host "Press Enter to exit" 