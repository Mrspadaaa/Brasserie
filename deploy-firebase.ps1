# Script de déploiement automatique sur Firebase Hosting
Write-Host "==========================================" -ForegroundColor Amber
Write-Host "  DÉPLOIEMENT BRASSERIE L'AFFINÉE (FIREBASE) " -ForegroundColor Amber
Write-Host "==========================================" -ForegroundColor Amber

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 1. Build de production
Write-Host "`n[1/3] Construction du bundle web optimisé..." -ForegroundColor Cyan
& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du build. Déploiement interrompu." -ForegroundColor Red
    exit 1
}

# 2. Vérification de connexion Firebase
Write-Host "`n[2/3] Vérification de la session Firebase..." -ForegroundColor Cyan
$accounts = & npx.cmd -y firebase-tools@latest login:list

if ($accounts -match "No authorized accounts") {
    Write-Host "Veuillez vous connecter à votre compte Google / Firebase dans la fenêtre qui va s'ouvrir :" -ForegroundColor Yellow
    & npx.cmd -y firebase-tools@latest login
}

# 3. Déploiement sur Firebase Hosting
Write-Host "`n[3/3] Déploiement sur Firebase Hosting..." -ForegroundColor Cyan
& npx.cmd -y firebase-tools@latest deploy --only hosting

Write-Host "`nDéploiement terminé avec succès ! Votre web app mobile est en ligne." -ForegroundColor Green
