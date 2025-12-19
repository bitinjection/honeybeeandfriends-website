<#
.SYNOPSIS
    Optimizes gallery display images for web performance.

.DESCRIPTION
    Processes images in the gallery folder, resizing and compressing them for optimal web display.
    Target: max 1600px width, JPEG quality 82%.

.PARAMETER SourcePath
    Path to the honeybee website root directory. Defaults to parent of script location.

.PARAMETER GalleryFolder
    Name of the gallery folder. Default is "gallery".

.PARAMETER Quality
    JPEG quality (1-100). Default is 82.

.PARAMETER MaxWidth
    Maximum width in pixels. Default is 1600.

.PARAMETER BackupOriginals
    If specified, copies originals to gallery-fullsize before optimization.

.PARAMETER WhatIf
    Shows what would be done without making changes.

.EXAMPLE
    .\Optimize-GalleryImages.ps1
    Optimizes all gallery images with default settings.

.EXAMPLE
    .\Optimize-GalleryImages.ps1 -BackupOriginals
    Backs up to gallery-fullsize before optimizing.
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$SourcePath = (Split-Path -Parent $PSScriptRoot),
    [string]$GalleryFolder = "gallery",
    [int]$Quality = 82,
    [int]$MaxWidth = 1600,
    [switch]$BackupOriginals
)

# Verify ImageMagick is available
try {
    $null = & magick --version 2>&1
} catch {
    Write-Error "ImageMagick is not installed or not in PATH. Install via: winget install ImageMagick.ImageMagick"
    exit 1
}

$galleryPath = Join-Path $SourcePath $GalleryFolder
$fullsizePath = Join-Path $SourcePath "gallery-fullsize"

if (-not (Test-Path $galleryPath)) {
    Write-Error "Gallery folder not found: $galleryPath"
    exit 1
}

Write-Host "`n=== Gallery Image Optimization ===" -ForegroundColor Cyan
Write-Host "Source: $galleryPath"
Write-Host "Settings: ${MaxWidth}px max width, JPEG quality $Quality%`n"

# Get all image files (excluding thumbnails subfolder)
$images = Get-ChildItem -Path "$galleryPath\*" -File -Include @("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG") |
    Where-Object { $_.DirectoryName -eq $galleryPath -and $_.Name -notmatch '~$' -and $_.Name -ne 'photos.zip' }

$totalSaved = 0
$processed = 0
$errors = 0

foreach ($image in $images) {
    $originalSize = $image.Length
    $originalSizeKB = [math]::Round($originalSize / 1KB, 2)

    # Skip small images (already optimized)
    if ($originalSizeKB -lt 100) {
        Write-Host "  SKIP: $($image.Name) (already small: $originalSizeKB KB)" -ForegroundColor Gray
        continue
    }

    # Backup to gallery-fullsize if requested
    if ($BackupOriginals) {
        if (-not (Test-Path $fullsizePath)) {
            New-Item -ItemType Directory -Path $fullsizePath -Force | Out-Null
        }
        $backupPath = Join-Path $fullsizePath $image.Name
        if (-not (Test-Path $backupPath)) {
            Copy-Item $image.FullName $backupPath
            Write-Host "  Backed up: $($image.Name)" -ForegroundColor Gray
        }
    }

    if ($PSCmdlet.ShouldProcess($image.Name, "Optimize image")) {
        $tempPath = Join-Path $env:TEMP "optimize_$($image.Name)"

        # Determine output format - convert PNG photos to JPEG
        $outputPath = $tempPath
        $isPng = $image.Extension -match "\.png$"

        # ImageMagick optimization
        $magickArgs = @(
            $image.FullName,
            "-resize", "${MaxWidth}x>",
            "-quality", $Quality,
            "-sampling-factor", "4:2:0",
            "-strip",
            "-interlace", "Plane"
        )

        # If PNG, convert to JPEG (unless it has transparency)
        if ($isPng) {
            # Check for transparency
            $hasAlpha = & magick identify -format "%A" $image.FullName 2>&1
            if ($hasAlpha -ne "True") {
                # No transparency, convert to JPEG
                $jpegName = [System.IO.Path]::ChangeExtension($image.Name, ".jpg")
                $outputPath = Join-Path $env:TEMP "optimize_$jpegName"
                $magickArgs += @("-background", "white", "-flatten")
            }
        }

        $magickArgs += $outputPath

        try {
            & magick @magickArgs 2>&1 | Out-Null

            if (Test-Path $outputPath) {
                $newSize = (Get-Item $outputPath).Length
                $newSizeKB = [math]::Round($newSize / 1KB, 2)
                $savedKB = $originalSizeKB - $newSizeKB
                $savedPercent = [math]::Round(($savedKB / $originalSizeKB) * 100, 1)

                if ($newSize -lt $originalSize) {
                    # Determine final path
                    $finalPath = $image.FullName
                    if ($isPng -and $outputPath -match "\.jpg$") {
                        # Converting PNG to JPEG - remove old PNG, use new JPEG name
                        $finalPath = Join-Path $galleryPath ([System.IO.Path]::ChangeExtension($image.Name, ".jpg"))
                        Remove-Item $image.FullName -Force
                    }

                    Move-Item $outputPath $finalPath -Force
                    $totalSaved += $savedKB
                    $processed++

                    $formatNote = if ($isPng -and $finalPath -match "\.jpg$") { " [PNG->JPG]" } else { "" }
                    Write-Host ("  OK: {0}{1} - {2} KB -> {3} KB (saved {4} KB, {5}%)" -f $image.Name, $formatNote, $originalSizeKB, $newSizeKB, $savedKB, $savedPercent) -ForegroundColor Green
                } else {
                    Remove-Item $outputPath -Force -ErrorAction SilentlyContinue
                    Write-Host "  SKIP: $($image.Name) (already optimized)" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  ERROR: Failed to process $($image.Name)" -ForegroundColor Red
                $errors++
            }
        } catch {
            Write-Host "  ERROR: $($image.Name) - $_" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Processed: $processed images"
Write-Host "Errors: $errors"
Write-Host ("Total saved: {0} KB ({1} MB)" -f [math]::Round($totalSaved, 2), [math]::Round($totalSaved / 1024, 2))
