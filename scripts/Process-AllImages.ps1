<#
.SYNOPSIS
    Master script to optimize all images on the Honeybee website.

.DESCRIPTION
    Runs the complete image optimization pipeline:
    1. Optimizes slideshow images (hero section)
    2. Converts PNG photos to JPEG
    3. Optimizes gallery display images
    4. Generates/regenerates thumbnails

    This script should be run after adding new images to ensure consistent optimization.

.PARAMETER SourcePath
    Path to the honeybee website root directory. Defaults to parent of script location.

.PARAMETER BackupOriginals
    Create backups before making changes.

.PARAMETER SkipSlideshow
    Skip slideshow optimization.

.PARAMETER SkipGallery
    Skip gallery optimization.

.PARAMETER SkipThumbnails
    Skip thumbnail generation.

.PARAMETER SkipPngConversion
    Skip PNG to JPEG conversion.

.PARAMETER Force
    Force regeneration of thumbnails even if they exist.

.PARAMETER WhatIf
    Shows what would be done without making changes.

.EXAMPLE
    .\Process-AllImages.ps1
    Runs complete optimization pipeline.

.EXAMPLE
    .\Process-AllImages.ps1 -BackupOriginals
    Runs optimization with backups.

.EXAMPLE
    .\Process-AllImages.ps1 -SkipSlideshow -Force
    Skip slideshow, force thumbnail regeneration.
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$SourcePath,
    [switch]$BackupOriginals,
    [switch]$SkipSlideshow,
    [switch]$SkipGallery,
    [switch]$SkipThumbnails,
    [switch]$SkipPngConversion,
    [switch]$Force
)

$ErrorActionPreference = "Continue"

# Handle script directory - works whether run directly or via -File
if ($PSScriptRoot) {
    $scriptDir = $PSScriptRoot
} else {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

# Default SourcePath to parent of script directory
if (-not $SourcePath) {
    $SourcePath = Split-Path -Parent $scriptDir
}

# Verify ImageMagick is available
try {
    $null = & magick --version 2>&1
} catch {
    Write-Error "ImageMagick is not installed or not in PATH. Install via: winget install ImageMagick.ImageMagick"
    exit 1
}

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║           HONEYBEE WEBSITE IMAGE OPTIMIZATION                 ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "Source Path: $SourcePath"
Write-Host "Backup: $(if($BackupOriginals){'Yes'}else{'No'})"
Write-Host ""

# Calculate initial size
$initialSize = Get-ChildItem -Path $SourcePath -Include @("*.jpg","*.jpeg","*.png","*.JPG","*.JPEG","*.PNG") -Recurse |
    Measure-Object -Property Length -Sum |
    Select-Object -ExpandProperty Sum
$initialSizeMB = [math]::Round($initialSize / 1MB, 2)

Write-Host "Initial total image size: $initialSizeMB MB" -ForegroundColor Yellow
Write-Host ""

$steps = @()

# Step 1: Slideshow Optimization
if (-not $SkipSlideshow) {
    $steps += @{
        Name = "Slideshow Optimization"
        Script = "Optimize-SlideshowImages.ps1"
        Args = @{ SourcePath = $SourcePath }
    }
    if ($BackupOriginals) { $steps[-1].Args.BackupOriginals = $true }
}

# Step 2: PNG to JPEG Conversion
if (-not $SkipPngConversion) {
    $steps += @{
        Name = "PNG to JPEG Conversion"
        Script = "Convert-PngToJpeg.ps1"
        Args = @{
            Path = $SourcePath
            Recursive = $true
            UpdateHtmlReferences = $true
        }
    }
    if ($BackupOriginals) { $steps[-1].Args.BackupOriginals = $true }
}

# Step 3: Gallery Optimization
if (-not $SkipGallery) {
    $steps += @{
        Name = "Gallery Image Optimization"
        Script = "Optimize-GalleryImages.ps1"
        Args = @{ SourcePath = $SourcePath }
    }
    if ($BackupOriginals) { $steps[-1].Args.BackupOriginals = $true }
}

# Step 4: Thumbnail Generation
if (-not $SkipThumbnails) {
    $steps += @{
        Name = "Thumbnail Generation"
        Script = "New-GalleryThumbnails.ps1"
        Args = @{ SourcePath = $SourcePath }
    }
    if ($Force) { $steps[-1].Args.Force = $true }
}

# Execute steps
$stepNum = 0
foreach ($step in $steps) {
    $stepNum++
    Write-Host "`n[$stepNum/$($steps.Count)] $($step.Name)" -ForegroundColor Magenta
    Write-Host ("=" * 50)

    $scriptPath = Join-Path $scriptDir $step.Script

    if (Test-Path $scriptPath) {
        try {
            $stepArgs = $step.Args
            & $scriptPath @stepArgs
        } catch {
            Write-Host "ERROR in $($step.Name): $_" -ForegroundColor Red
        }
    } else {
        Write-Host "Script not found: $scriptPath" -ForegroundColor Red
    }
}

# Calculate final size
Write-Host "`n"
Write-Host ("=" * 60) -ForegroundColor Cyan

$finalSize = Get-ChildItem -Path $SourcePath -Include @("*.jpg","*.jpeg","*.png","*.JPG","*.JPEG","*.PNG") -Recurse |
    Measure-Object -Property Length -Sum |
    Select-Object -ExpandProperty Sum
$finalSizeMB = [math]::Round($finalSize / 1MB, 2)
$savedMB = [math]::Round(($initialSize - $finalSize) / 1MB, 2)
$savedPercent = if ($initialSize -gt 0) { [math]::Round((($initialSize - $finalSize) / $initialSize) * 100, 1) } else { 0 }

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                    OPTIMIZATION COMPLETE                      ║
╠═══════════════════════════════════════════════════════════════╣
║  Initial Size:  $($initialSizeMB.ToString().PadLeft(10)) MB                               ║
║  Final Size:    $($finalSizeMB.ToString().PadLeft(10)) MB                               ║
║  Saved:         $($savedMB.ToString().PadLeft(10)) MB ($savedPercent%)                         ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

# Show slideshow-specific stats
Write-Host "Slideshow Images (loaded on every page):" -ForegroundColor Yellow
$slideshowImages = @("slideshow-opendoor.jpg", "Garden.jpg", "house.jpeg", "slideshow-readingbee.jpg", "slideshow-closeddoor.jpg")
$slideshowTotal = 0
foreach ($img in $slideshowImages) {
    $imgPath = Join-Path $SourcePath $img
    if (Test-Path $imgPath) {
        $size = [math]::Round((Get-Item $imgPath).Length / 1KB, 2)
        $slideshowTotal += $size
        Write-Host ("  {0,25}: {1,8} KB" -f $img, $size)
    }
}
Write-Host ("  {0,25}: {1,8} KB ({2} MB)" -f "TOTAL", $slideshowTotal, [math]::Round($slideshowTotal/1024, 2)) -ForegroundColor Cyan
