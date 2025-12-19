<#
.SYNOPSIS
    Optimizes slideshow images for web performance.

.DESCRIPTION
    Resizes and compresses slideshow images to appropriate dimensions for web display.
    Target: max 1920x800 pixels, JPEG quality 82%, optimized for fast loading.

.PARAMETER SourcePath
    Path to the honeybee website root directory. Defaults to parent of script location.

.PARAMETER Quality
    JPEG quality (1-100). Default is 82 which provides good balance of quality and size.

.PARAMETER MaxWidth
    Maximum width in pixels. Default is 1920.

.PARAMETER MaxHeight
    Maximum height in pixels. Default is 800 (slideshow displays at max-height: 400px, 2x for retina).

.PARAMETER BackupOriginals
    If specified, creates backups of original files before optimization.

.PARAMETER WhatIf
    Shows what would be done without making changes.

.EXAMPLE
    .\Optimize-SlideshowImages.ps1
    Optimizes all slideshow images with default settings.

.EXAMPLE
    .\Optimize-SlideshowImages.ps1 -BackupOriginals -Quality 85
    Optimizes with backups and higher quality.
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$SourcePath = (Split-Path -Parent $PSScriptRoot),
    [int]$Quality = 82,
    [int]$MaxWidth = 1920,
    [int]$MaxHeight = 800,
    [switch]$BackupOriginals
)

# Verify ImageMagick is available
try {
    $null = & magick --version 2>&1
} catch {
    Write-Error "ImageMagick is not installed or not in PATH. Install via: winget install ImageMagick.ImageMagick"
    exit 1
}

# Slideshow images (from index.html)
$slideshowImages = @(
    "slideshow-opendoor.jpg",
    "Garden.jpg",
    "house.jpeg",
    "slideshow-readingbee.jpg",
    "slideshow-closeddoor.jpg"
)

Write-Host "`n=== Slideshow Image Optimization ===" -ForegroundColor Cyan
Write-Host "Source: $SourcePath"
Write-Host "Settings: ${MaxWidth}x${MaxHeight} max, JPEG quality $Quality%`n"

$totalSaved = 0
$processed = 0

foreach ($imageName in $slideshowImages) {
    $imagePath = Join-Path $SourcePath $imageName

    if (-not (Test-Path $imagePath)) {
        Write-Host "  SKIP: $imageName (not found)" -ForegroundColor Yellow
        continue
    }

    $originalSize = (Get-Item $imagePath).Length
    $originalSizeKB = [math]::Round($originalSize / 1KB, 2)

    # Create backup if requested
    if ($BackupOriginals) {
        $backupDir = Join-Path $SourcePath "backups"
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        $backupPath = Join-Path $backupDir $imageName
        if (-not (Test-Path $backupPath)) {
            Copy-Item $imagePath $backupPath
            Write-Host "  Backed up: $imageName" -ForegroundColor Gray
        }
    }

    if ($PSCmdlet.ShouldProcess($imageName, "Optimize image")) {
        # Create temp file for processing
        $tempPath = Join-Path $env:TEMP "optimize_$imageName"

        # ImageMagick optimization command
        # -resize: Scale to fit within dimensions (maintains aspect ratio)
        # -quality: JPEG compression quality
        # -sampling-factor: Chroma subsampling for smaller files
        # -strip: Remove metadata (EXIF, etc.)
        # -interlace Plane: Progressive JPEG for better perceived loading
        $magickArgs = @(
            $imagePath,
            "-resize", "${MaxWidth}x${MaxHeight}>",
            "-quality", $Quality,
            "-sampling-factor", "4:2:0",
            "-strip",
            "-interlace", "Plane",
            $tempPath
        )

        & magick @magickArgs 2>&1 | Out-Null

        if (Test-Path $tempPath) {
            $newSize = (Get-Item $tempPath).Length
            $newSizeKB = [math]::Round($newSize / 1KB, 2)
            $savedKB = $originalSizeKB - $newSizeKB
            $savedPercent = [math]::Round(($savedKB / $originalSizeKB) * 100, 1)

            # Only replace if we actually saved space
            if ($newSize -lt $originalSize) {
                Move-Item $tempPath $imagePath -Force
                $totalSaved += $savedKB
                $processed++
                Write-Host ("  OK: {0} - {1} KB -> {2} KB (saved {3} KB, {4}%)" -f $imageName, $originalSizeKB, $newSizeKB, $savedKB, $savedPercent) -ForegroundColor Green
            } else {
                Remove-Item $tempPath -Force
                Write-Host "  SKIP: $imageName (already optimized)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ERROR: Failed to process $imageName" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Processed: $processed images"
Write-Host ("Total saved: {0} KB ({1} MB)" -f [math]::Round($totalSaved, 2), [math]::Round($totalSaved / 1024, 2))
