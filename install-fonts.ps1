# Script para descargar fuentes Poppins desde Google Fonts CDN

$fonts = @(
    @{name="Poppins-Regular"; url="https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf"},
    @{name="Poppins-Medium"; url="https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Medium.ttf"},
    @{name="Poppins-SemiBold"; url="https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-SemiBold.ttf"},
    @{name="Poppins-Bold"; url="https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf"},
    @{name="Poppins-ExtraBold"; url="https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-ExtraBold.ttf"},
    @{name="Poppins-Black"; url="https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Black.ttf"}
)

$destFolder = "assets\fonts"
New-Item -ItemType Directory -Force -Path $destFolder | Out-Null

Write-Host "🔤 Descargando fuentes Poppins..." -ForegroundColor Cyan

foreach ($font in $fonts) {
    try {
        $destPath = Join-Path $destFolder "$($font.name).ttf"
        Write-Host "  Descargando $($font.name)..." -NoNewline
        Invoke-WebRequest -Uri $font.url -OutFile $destPath -ErrorAction Stop
        Write-Host " ✓" -ForegroundColor Green
    } catch {
        Write-Host " ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✨ Fuentes Poppins instaladas exitosamente!" -ForegroundColor Green
Write-Host "📁 Ubicación: $destFolder" -ForegroundColor Yellow
