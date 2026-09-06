@echo off
title Deploiement Firebase - Brasserie L'Affinee
color 0E
cd /d "%~dp0"

echo ===================================================
echo   DEPLOIEMENT FIREBASE - BRASSERIE L'AFFINEE
echo ===================================================
echo.

echo [1/3] Construction du bundle de production...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [ERREUR] Le build a echoue.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Connexion au compte Google / Firebase...
call npx.cmd -y firebase-tools@latest login
if %errorlevel% neq 0 (
    echo [ERREUR] Impossible de se connecter a Firebase.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Deploiement sur Firebase Hosting...
call npx.cmd -y firebase-tools@latest deploy --only hosting
if %errorlevel% neq 0 (
    echo [ERREUR] Le deploiement a echoue.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo   SUCCES ! Votre application est en ligne sur :
echo   https://brasserie-laffinee.web.app
echo ===================================================
echo.
pause
