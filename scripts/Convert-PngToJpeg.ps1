<#
.SYNOPSIS
    Converts PNG photographs to JPEG format for better compression.

.DESCRIPTION
    Scans for PNG files that are photographs (not graphics with transparency) and converts
    them to JPEG format. This typically reduces file size by 70-90% for photos.

.PARAMETER Path
    Path to scan for PNG files. Defaults to honeybee website root.

.PARAMETER Quality
    JPEG quality (1-100). Default is 85.

.PARAMETER MinSizeKB
    Only convert PNGs larger than this size in KB. Default is 100.

.PARAMETER Recursive
    Scan subdirectories.

.PARAMETER UpdateHtmlReferences
    Update references in index.html from .png to .jpg.

.PARAMETER BackupOriginals
    Keep original PNG files with .png.bak extension.

.PARAMETER WhatIf
    Shows what would be done without making changes.

.EXAMPLE
    .\Convert-PngToJpeg.ps1
    Converts large PNG photos in the root directory.

.EXAMPLE
    .\Convert-PngToJpeg.ps1 -Recursive -UpdateHtmlReferences
    Converts all PNG photos and updates HTML references.
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$Path = (Split-Path -Parent $PSScriptRoot),
    [int]$Quality = 85,
    [int]$MinSizeKB = 100,
    [switch]$Recursive,
    [switch]$UpdateHtmlReferences,
    [switch]$BackupOriginals
)

# Verify ImageMagick is available
try {
    $null = & magick --version 2>&1
} catch {
    Write-Error "ImageMagick is not installed or not in PATH. Install via: winget install ImageMagick.ImageMagick"
    exit 1
}

Write-Host "`n=== PNG to JPEG Conversion ===" -ForegroundColor Cyan
Write-Host "Path: $Path"
Write-Host "Settings: JPEG quality $Quality%, min size ${MinSizeKB}KB`n"

# Get PNG files
$searchParams = @{
    Path = $Path
    Filter = "*.png"
}
if ($Recursive) {
    $searchParams.Recurse = $true
}

$pngFiles = Get-ChildItem @searchParams | Where-Object {
    ($_.Length / 1KB) -ge $MinSizeKB
}

$converted = 0
$skipped = 0
$totalSaved = 0
$htmlUpdates = @{}

foreach ($png in $pngFiles) {
    # Check if this PNG has transparency (true graphics, not photos)
    $hasAlpha = & magick identify -format "%A" $png.FullName 2>&1

    if ($hasAlpha -eq "True") {
        # Check if alpha channel is actually used (not just present)
        $alphaStats = & magick identify -format "%[opaque]" $png.FullName 2>&1
        if ($alphaStats -eq "False") {
            Write-Host "  SKIP: $($png.Name) (has transparency)" -ForegroundColor Yellow
            $skipped++
            continue
        }
    }

    $jpegPath = [System.IO.Path]::ChangeExtension($png.FullName, ".jpg")
    $jpegName = [System.IO.Path]::ChangeExtension($png.Name, ".jpg")

    # Skip if JPEG already exists
    if (Test-Path $jpegPath) {
        Write-Host "  SKIP: $($png.Name) (JPEG already exists)" -ForegroundColor Gray
        $skipped++
        continue
    }

    if ($PSCmdlet.ShouldProcess($png.Name, "Convert to JPEG")) {
        try {
            $magickArgs = @(
                $png.FullName,
                "-background", "white",
                "-flatten",
                "-quality", $Quality,
                "-sampling-factor", "4:2:0",
                "-strip",
                "-interlace", "Plane",
                $jpegPath
            )

            & magick @magickArgs 2>&1 | Out-Null

            if (Test-Path $jpegPath) {
                $pngSize = [math]::Round($png.Length / 1KB, 2)
                $jpegSize = [math]::Round((Get-Item $jpegPath).Length / 1KB, 2)
                $saved = $pngSize - $jpegSize
                $savedPercent = [math]::Round(($saved / $pngSize) * 100, 1)

                if ($jpegSize -lt $pngSize) {
                    $totalSaved += $saved

                    # Handle original PNG
                    if ($BackupOriginals) {
                        Rename-Item $png.FullName "$($png.FullName).bak"
                    } else {
                        Remove-Item $png.FullName -Force
                    }

                    # Track for HTML updates
                    $relativePath = $png.FullName.Replace($Path, "").TrimStart("\", "/")
                    $htmlUpdates[$png.Name] = $jpegName

                    Write-Host ("  OK: {0} -> {1} ({2} KB -> {3} KB, saved {4}%)" -f $png.Name, $jpegName, $pngSize, $jpegSize, $savedPercent) -ForegroundColor Green
                    $converted++
                } else {
                    # JPEG is larger (rare for photos) - keep PNG
                    Remove-Item $jpegPath -Force
                    Write-Host "  SKIP: $($png.Name) (JPEG would be larger)" -ForegroundColor Yellow
                    $skipped++
                }
            } else {
                Write-Host "  ERROR: Failed to convert $($png.Name)" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ERROR: $($png.Name) - $_" -ForegroundColor Red
        }
    }
}

# Update HTML references if requested
if ($UpdateHtmlReferences -and $htmlUpdates.Count -gt 0) {
    $htmlPath = Join-Path $Path "index.html"
    if (Test-Path $htmlPath) {
        Write-Host "`n=== Updating HTML References ===" -ForegroundColor Cyan

        $html = Get-Content $htmlPath -Raw
        $originalHtml = $html

        foreach ($pngName in $htmlUpdates.Keys) {
            $jpegName = $htmlUpdates[$pngName]
            $html = $html -replace [regex]::Escape($pngName), $jpegName
            Write-Host "  Updated: $pngName -> $jpegName"
        }

        if ($html -ne $originalHtml) {
            if ($PSCmdlet.ShouldProcess("index.html", "Update image references")) {
                Set-Content $htmlPath $html -NoNewline
                Write-Host "  Saved index.html" -ForegroundColor Green
            }
        }
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Converted: $converted files"
Write-Host "Skipped: $skipped files"
Write-Host ("Total saved: {0} KB ({1} MB)" -f [math]::Round($totalSaved, 2), [math]::Round($totalSaved / 1024, 2))
