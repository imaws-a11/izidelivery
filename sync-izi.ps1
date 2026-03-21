# ─────────────────────────────────────────────────────────────
#  sync-izi.ps1 — Aplica o ZIP do Claude no projeto local
#
#  Uso no PowerShell:
#    .\sync-izi.ps1 -Zip "C:\Users\Voce\Downloads\izidelivery-icons3d.zip"
#
#  Ou com pasta do projeto customizada:
#    .\sync-izi.ps1 -Zip "C:\Downloads\arquivo.zip" -Project "C:\projetos\izidelivery-main"
# ─────────────────────────────────────────────────────────────

param(
    [Parameter(Mandatory=$true)]
    [string]$Zip,
    [string]$Project = (Get-Location).Path
)

$EXCLUDE = @("node_modules", ".vercel", "dist", ".env", ".env.local", ".env.production")

Write-Host ""
Write-Host "🚀 izidelivery sync" -ForegroundColor Cyan
Write-Host "   ZIP:     $Zip"
Write-Host "   Projeto: $Project"
Write-Host ""

if (-not (Test-Path $Zip)) {
    Write-Host "❌ ZIP nao encontrado: $Zip" -ForegroundColor Red; exit 1
}
if (-not (Test-Path $Project)) {
    Write-Host "❌ Pasta do projeto nao encontrada: $Project" -ForegroundColor Red; exit 1
}

$TMP = Join-Path $env:TEMP "izi-sync-$(Get-Random)"
New-Item -ItemType Directory -Path $TMP | Out-Null

Write-Host "📦 Extraindo ZIP..." -ForegroundColor Yellow
Expand-Archive -Path $Zip -DestinationPath $TMP -Force

$ZIP_ROOT = (Get-ChildItem $TMP | Select-Object -First 1).FullName
Write-Host "📂 Raiz: $(Split-Path $ZIP_ROOT -Leaf)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Arquivos que serao atualizados:" -ForegroundColor Yellow

$changes = @()
Get-ChildItem -Path $ZIP_ROOT -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($ZIP_ROOT.Length + 1)
    $skip = $false
    foreach ($ex in $EXCLUDE) {
        if ($rel -like "$ex*") { $skip = $true; break }
    }
    if ($skip) { return }
    $changes += $rel
    $dest = Join-Path $Project $rel
    if (Test-Path $dest) {
        Write-Host "   ~ $rel" -ForegroundColor DarkGray
    } else {
        Write-Host "   + $rel" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Total: $($changes.Count) arquivo(s)" -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Confirmar sync? (s/N)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "Cancelado." -ForegroundColor Red
    Remove-Item -Recurse -Force $TMP; exit 0
}

Write-Host ""
Write-Host "🔄 Sincronizando..." -ForegroundColor Yellow

$copied = 0
Get-ChildItem -Path $ZIP_ROOT -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($ZIP_ROOT.Length + 1)
    $skip = $false
    foreach ($ex in $EXCLUDE) {
        if ($rel -like "$ex*") { $skip = $true; break }
    }
    if ($skip) { return }
    $dest = Join-Path $Project $rel
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Copy-Item -Path $_.FullName -Destination $dest -Force
    Write-Host "   ✔ $rel" -ForegroundColor Green
    $copied++
}

Remove-Item -Recurse -Force $TMP

Write-Host ""
Write-Host "✅ $copied arquivo(s) atualizados!" -ForegroundColor Green
Write-Host ""

$restart = Read-Host "Reiniciar dev servers? (s/N)"
if ($restart -eq "s" -or $restart -eq "S") {
    Write-Host "Parando Vite..." -ForegroundColor Yellow
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Set-Location $Project
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:all"
    Write-Host ""
    Write-Host "   Admin:      http://localhost:5173"
    Write-Host "   Servicos:   http://localhost:5174"
    Write-Host "   Entregador: http://localhost:5175"
}

Write-Host ""
Write-Host "🎉 Pronto!" -ForegroundColor Green
