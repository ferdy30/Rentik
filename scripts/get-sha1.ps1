# Script para obtener SHA-1 fingerprint en Windows
# Ejecutar en PowerShell

Write-Host "=== Obteniendo SHA-1 Fingerprint ===" -ForegroundColor Cyan
Write-Host ""

$androidHome = $env:USERPROFILE + "\.android"
$debugKeystore = $androidHome + "\debug.keystore"

Write-Host "Buscando keystore en: $debugKeystore" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $debugKeystore) {
    Write-Host "✅ Keystore encontrado!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ejecutando keytool..." -ForegroundColor Cyan
    Write-Host ""
    
    keytool -list -v -keystore $debugKeystore -alias androiddebugkey -storepass android -keypass android
    
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "📋 COPIA el SHA1 que aparece arriba" -ForegroundColor Yellow
    Write-Host "==================================" -ForegroundColor Cyan
} else {
    Write-Host "❌ No se encontró debug.keystore" -ForegroundColor Red
    Write-Host ""
    Write-Host "Es posible que necesites ejecutar la app en Android al menos una vez." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O instala Android Studio y genera el keystore manualmente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
