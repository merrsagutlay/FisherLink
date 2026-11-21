@echo off
cd /d "%~dp0"
echo Starting FishMatch... open http://127.0.0.1:8000 in your browser
python app.py
if errorlevel 1 py app.py
pause
