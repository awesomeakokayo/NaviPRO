@echo off
echo Starting NaviPRO Backend Server...
echo.
echo Make sure you have:
echo 1. Python installed
echo 2. .env file with your API keys
echo 3. All dependencies installed
echo.
echo Installing dependencies...
cd backend
pip install -r requirements.txt
echo.
echo Starting server...
python agent_orchestra.py
pause 