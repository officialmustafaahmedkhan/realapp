@echo off
echo Starting Chat Application...

:: Start Backend
start "Chat Server" cmd /k "cd server && node server.js"

:: Start Frontend
start "Chat Client" cmd /k "cd client && npm run dev"

echo.
echo Application started! 
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000
echo.
pause
