# Déploie les règles et index, les Functions, puis le frontend compatible.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Write-Host 'Déploiement complet : base, serveur, interface.'
& npm.cmd run deploy
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Déploiement interrompu. Aucun succès global confirmé.'
    exit 1
}
Write-Host 'Déploiement complet confirmé par Firebase.' -ForegroundColor Green
