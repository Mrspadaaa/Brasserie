@echo off
title Deploiement complet - Brasserie L'Affinee
cd /d "%~dp0"
echo Deploiement des regles et index, des Functions, puis de l'interface.
call npm.cmd run deploy
if errorlevel 1 (
    echo [ERREUR] Deploiement interrompu. Aucun succes global confirme.
    pause
    exit /b 1
)
echo Deploiement complet confirme par Firebase.
pause
